import {STORAGE_KEY, emptyState, normalizeState, routeFromHash, updateProgress, wordInContext, quizChoices} from './core.js';
import {FINAL_GROUPS, FINALS, INITIALS, SPELLING_LETTERS, WHOLE_SYLLABLES, PRACTICE_CATEGORIES, TONE_GROUPS, TONE_BASES, toneExamples, nextPracticeCategory, practicePool, pinyinAudio, toneName} from './pinyin.js';
import {readingLevelLabel} from './reading-levels.js';
import {AudioPlayer, chineseVoices} from './audio.js';
import {downloadLibrary, offlineSize, registerOffline, checkForUpdate, prepareReload, refreshLibrary} from './offline.js';
import {mountParentHold} from './parent-gate.js';

const app = document.querySelector('#app');
const wordDialog = document.querySelector('#word-dialog');
const confirmDialog = document.querySelector('#confirm-dialog');
const parentDialog = document.querySelector('#parent-dialog');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const paths = {
  book: '<path d="M3 5q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1Z"/><path d="M12 6v14"/>',
  sound: '<path d="m11 5-5 4H3v6h3l5 4Z"/><path d="M15 8q5 4 0 8m3-11q8 7 0 14"/>',
  leaf: '<path d="M5 20Q2 3 21 3q0 17-16 17Zm0 0L16 8"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  home: '<path d="m3 10 9-7 9 7v11H3Zm6 11v-8h6v8"/>',
  heart: '<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2A5 5 0 0 1 22 8c0 7-10 13-10 13Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  parent: '<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z"/><path d="m8 12 3 3 5-6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`;
let books = [], sources = [], state = emptyState(), route;
let pinyinTab = 'finals', lastQuizScope = '', toneBase = 'a', quiz = null, selectedWord = null;
let sequencePaused = false;
let parentAccess = false, lastPublicHash = '#/shelf', disposeParentHold;
let libraryBusy = false, maintenanceMessage = '', resourceMessage = '';
const selectedPinyin = {finals: 'a', initials: 'initial-b', whole: 'whole-zhi'};
let bookLevel = 'all', bookFilter = '全部故事', offlineScope = 'all', toastTimer, storageWarning = false;
const audio = new AudioPlayer(playing => {
  document.querySelectorAll('[data-page-play]').forEach(el => { el.innerHTML = icon(playing ? 'pause' : 'sound') + (playing ? '暂停朗读' : '读这一页'); el.setAttribute('aria-pressed', String(playing)); });
});

function notify(message) {
  const el = document.querySelector('#status');
  el.textContent = message; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 4500);
}
function persist(next) {
  state = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { storageWarning = true; notify('这次的记录暂时无法保存。请检查浏览器存储空间。'); return false; }
}
async function play(src) {
  try { return await audio.play(src); }
  catch { notify('声音暂时没有播放成功，请再点一次。离线时可先下载故事包。'); return false; }
}
async function playPinyin(id) {
  const source = pinyinAudio(id);
  if (source) return play(source);
  notify('这个音的示范正在补充，先和家长一起读。');
  return false;
}
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
function closeParent() {
  disposeParentHold?.(); disposeParentHold = null;
  if (parentDialog.open) parentDialog.close();
}
function requestParent() {
  if (route?.section === 'parent' || parentDialog.open) return;
  audio.stop();
  parentDialog.innerHTML = `<h2 id="parent-title">家长小角</h2><p>请家长长按下面的按钮 1 秒进入。</p><div class="dialog-actions"><button type="button" class="button primary parent-hold" id="parent-hold">长按 1 秒进入</button><button class="button secondary" data-cancel-parent>取消</button></div>`;
  parentDialog.showModal();
  disposeParentHold = mountParentHold(parentDialog.querySelector('#parent-hold'), () => {
    parentAccess = true; closeParent(); go('#/parent');
  });
}
function bookLink(book) { return `#/book/${book.id}/${(state.progress[book.id]?.page || 0) + 1}`; }

function shell(section, content) {
  const nav = [['shelf', 'book', '故事书架'], ['pinyin', 'sun', '学拼音'], ['words', 'leaf', '我的生字']];
  return `<aside class="sidebar"><a class="brand" href="#/shelf"><img src="./assets/icon.svg" alt="" width="48" height="48"><span>阅读小花园<small>每一页，都有新发现</small></span></a>
    <nav aria-label="主要导航">${nav.map(([id, ico, label]) => `<a href="#/${id}" class="nav-item ${section === id ? 'active' : ''}" ${section === id ? 'aria-current="page"' : ''}>${icon(ico)}<span>${label}</span>${id === 'words' && state.words.length ? `<span class="count">${state.words.length}</span>` : ''}</a>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="little-plant" aria-hidden="true"><span></span><i></i><b></b></div><p>慢慢读，慢慢长大。</p><a class="parent-link" href="#/parent" ${section === 'parent' ? 'aria-current="page"' : ''}>${icon('parent')}家长小角</a></div></aside>
    <main id="main" class="main-content" tabindex="-1">${content}</main>`;
}

function shelf() {
  const last = [...books].sort((a, b) => (state.progress[b.id]?.updated || 0) - (state.progress[a.id]?.updated || 0))[0];
  const hasProgress = !!state.progress[last.id];
  const visibleBooks = books.filter(book => (bookLevel === 'all' || String(book.sourceLevel.value) === bookLevel) && (bookFilter === '全部故事' || book.tag === bookFilter));
  const tags = ['全部故事', ...new Set(books.map(book => book.tag))];
  return shell('shelf', `<header class="page-header"><div><span class="eyebrow">故事书架</span><h1>今天，也读一个好故事。</h1></div><span class="header-note">${icon('leaf')}从一页开始</span></header>
    <section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="pill">${hasProgress ? '接着上次的故事' : '从这本开始吧'}</span><h2 id="hero-title">小小的书，<br>大大的世界<span class="sun-dot" aria-hidden="true">✳</span></h2><p>${esc(last.intro)}</p><a class="button primary" href="${bookLink(last)}">${hasProgress ? '继续阅读' : '打开故事'}${icon('arrow')}</a><span class="hero-caption">${esc(last.title)} · ${last.pages.length}页图画故事</span></div><a class="hero-art" href="${bookLink(last)}" aria-label="阅读${esc(last.title)}"><span class="art-orbit" aria-hidden="true"></span><img src="${last.cover}" alt="${esc(last.title)}的绘本封面"><span class="floating-label">翻开一页，遇见惊喜</span></a></section>
    <section class="bookshelf" aria-labelledby="shelf-heading"><div class="section-heading"><div><h2 id="shelf-heading">选一本，慢慢读</h2><p>看图、读故事，遇到生字就点一下。</p></div><span class="small-note">${visibleBooks.length} / ${books.length}本绘本</span></div><div class="filters level-filters" aria-label="故事级别">${['all', '1', '2', '3', '4', '5'].map(level => `<button data-book-level="${level}" class="filter ${bookLevel === level ? 'selected' : ''}" aria-pressed="${bookLevel === level}">${level === 'all' ? '全部级别' : `${level}级`}</button>`).join('')}</div><div class="shelf-tools"><label for="book-theme">主题</label><select id="book-theme">${tags.map(tag => `<option value="${esc(tag)}" ${tag === bookFilter ? 'selected' : ''}>${esc(tag)}</option>`).join('')}</select><span class="small-note" role="status">找到 ${visibleBooks.length} 本故事</span></div><div class="book-grid">${visibleBooks.map(bookCard).join('')}</div>${visibleBooks.length ? '' : '<p class="page-description">这个级别暂时没有这一主题的故事，换一个主题看看吧。</p>'}</section>
    <footer class="site-footer">每个孩子都有自己的阅读节奏。<a href="#/parent">故事与声音来源</a></footer>`);
}
function bookCard(book) {
  const p = state.progress[book.id];
  const level = readingLevelLabel(book.sourceLevel);
  return `<a class="book-card ${book.color}" href="${bookLink(book)}"><div class="book-cover"><img src="${book.cover}" alt="${esc(book.title)}" loading="lazy"><span class="book-status">${p?.finished ? '读过啦' : p ? `读到第${p.page + 1}页` : '打开看看'}</span></div><div class="book-info">${level ? `<span class="book-level" aria-label="${esc(book.sourceLevel.system)} 原站${esc(level)}">${esc(level)}</span>` : ''}<span class="book-category">${book.tag} <span>· ${book.pages.length}页</span></span><h3>${esc(book.title)}</h3><p>${esc(book.intro)}</p><span class="read-link">${p ? '继续读' : '开始读'}${icon('arrow')}</span></div></a>`;
}

function reader() {
  const {book, page} = route, current = book.pages[page];
  const chars = Array.from(current.text).map((char, index) => /\p{Script=Han}/u.test(char) ? `<button class="character" data-char="${index}" aria-label="认识${esc(char)}">${esc(char)}</button>` : `<span>${esc(char)}</span>`).join('');
  return `<main class="reader" id="main"><header class="reader-header"><a href="#/shelf" class="back-link">${icon('back')}回到书架</a><h1>${esc(book.title)}</h1></header>
    <div class="reading-progress" aria-label="阅读进度"><span style="width:${(page + 1) / book.pages.length * 100}%"></span></div>
    <section class="reading-spread" aria-label="第${page + 1}页"><div class="page-art"><img src="${current.image}" alt="故事插图：${esc(current.text)}"></div><div class="page-words"><span class="eyebrow">第 ${page + 1} 页 / 共 ${book.pages.length} 页</span><p class="story-text" aria-label="${esc(current.text)}">${chars}</p><button class="button primary play-page" data-page-play aria-pressed="false">${icon('sound')}读这一页</button><p class="reading-hint">遇到不认识的字，点一下就能求助。</p></div></section>
    <nav class="page-controls" aria-label="翻页"><button class="button secondary" data-prev ${page === 0 ? 'disabled' : ''}>${icon('back')}上一页</button><div class="page-dots">${book.pages.map((_, i) => `<button class="page-dot ${i === page ? 'current' : ''}" data-page="${i}" aria-label="第${i + 1}页" ${i === page ? 'aria-current="page"' : ''}><span></span></button>`).join('')}</div><button class="button ${page === book.pages.length - 1 ? 'primary' : 'secondary'}" data-next>${page === book.pages.length - 1 ? '读完啦' : '下一页'}${icon(page === book.pages.length - 1 ? 'check' : 'arrow')}</button></nav>
    <div class="reader-offline"><button class="text-button" data-download-book="${book.id}">${icon('download')}下载这本书</button><span id="book-download-status" class="small-note" role="status"></span></div><details class="reader-credit"><summary>这本书的作者与来源</summary>${bookCredit(book)}</details></main>`;
}

function showWord(index, entry) {
  audio.stop();
  const book = entry ? books.find(b => b.id === entry.bookId) : route.book;
  const page = entry ? entry.page : route.page;
  const text = book.pages[page].text;
  const position = entry ? text.indexOf(entry.char) : index;
  selectedWord = {char: text[position], bookId: book.id, page};
  const context = wordInContext(text, position), saved = state.words.some(w => w.char === context.char);
  wordDialog.innerHTML = `<button class="dialog-close" data-close aria-label="关闭">${icon('close')}</button><span class="eyebrow">在故事里认识它</span><h2 id="word-title" class="big-character">${esc(context.char)}</h2><h3>${esc(context.word)}</h3><p>${esc(context.meaning)}</p><blockquote>${esc(text)}</blockquote><div class="dialog-actions"><button class="button secondary" data-word-listen>${icon('sound')}听原句</button><button class="button primary" data-save-word ${saved ? 'disabled' : ''}>${icon('leaf')}${saved ? '已放进生字篮' : '放进生字篮'}</button></div><button class="text-button" data-speak-word>听“${esc(context.word)}”的读音</button>`;
  wordDialog.showModal();
}

function completion() {
  const {book} = route;
  persist(updateProgress(state, book, book.pages.length - 1, true));
  app.innerHTML = shell('shelf', `<section class="completion"><span class="completion-flower" aria-hidden="true">${icon('leaf')}</span><span class="eyebrow">故事读完啦</span><h1>又认识了一个小世界。</h1><p>${esc(book.question)}</p><div class="completion-cover"><img src="${book.cover}" alt="${esc(book.title)}"></div><div class="dialog-actions"><a class="button secondary" href="#/book/${book.id}/1">再读一遍</a><a class="button primary" href="#/shelf">选下一个故事${icon('arrow')}</a></div><a class="text-button" href="#/words">去看看我的生字篮</a></section>`);
  window.scrollTo(0, 0);
  app.querySelector('h1')?.focus();
}

function words() {
  return shell('words', `<header class="page-header"><div><span class="eyebrow">我的生字</span><h1>把新朋友，装进小篮子。</h1></div><span class="header-note">${icon('leaf')}${state.words.length}个字</span></header><p class="page-description">读故事时点一下汉字，就可以把想再读的字收在这里。</p>${state.words.length ? `<div class="word-grid">${state.words.map((w, i) => { const b = books.find(b => b.id === w.bookId); return `<article class="saved-word"><button data-saved-word="${i}" aria-label="复习${esc(w.char)}"><span>${esc(w.char)}</span><small>${esc(b.title)}</small></button><a href="#/book/${w.bookId}/${w.page + 1}">回到故事${icon('arrow')}</a><button class="remove-word" data-remove-word="${i}" aria-label="移出生字${esc(w.char)}">${icon('close')}</button></article>`; }).join('')}</div>` : `<div class="empty-state"><div class="empty-leaf">${icon('leaf')}</div><h2>小篮子等着你的新发现</h2><p>先去读个故事吧，遇见想认识的字再收进来。</p><a class="button primary" href="#/shelf">去找故事${icon('arrow')}</a></div>`}`);
}

function pinyin() {
  const tabs = [['finals', '认识韵母'], ['initials', '声母与 y w'], ['whole', '整体认读'], ['tones', '听听四声'], ['quiz', '听音找朋友']];
  const lesson = pinyinTab === 'finals' ? finalLesson() : pinyinTab === 'initials' ? initialLesson() : pinyinTab === 'whole' ? wholeLesson() : pinyinTab === 'tones' ? toneLesson() : quizLesson();
  return shell('pinyin', `<header class="page-header"><div><span class="eyebrow">拼音小课堂 · 一起听读音</span><h1>听听声音，动动小嘴巴。</h1></div><span class="header-note">${icon('sun')}和家长一起学</span></header><p class="page-description">24 个韵母、21 个声母和 y、w，还有 16 个整体认读音节。一次认识一点点。</p><div class="lesson-tabs" aria-label="拼音活动">${tabs.map(([id, title]) => `<button data-pinyin-tab="${id}" class="${pinyinTab === id ? 'selected' : ''}" aria-pressed="${pinyinTab === id}">${title}</button>`).join('')}</div>${lesson}<p class="lesson-note">这里学习拼音，故事里安心读汉字。两边可以随时切换。</p>`);
}
function soundPicker(items, label, compact = false) {
  return `<div class="vowel-picker ${compact ? 'compact-picker' : ''}" aria-label="选择${label}">${items.map(item => `<button data-pinyin-item="${item.id}" class="${item.color} ${item.id === selectedPinyin[pinyinTab] ? 'selected' : ''}" aria-label="${label}${item.symbol}" aria-pressed="${item.id === selectedPinyin[pinyinTab]}">${item.symbol}</button>`).join('')}</div>`;
}
function soundLesson(item) {
  const available = Boolean(pinyinAudio(item.id));
  const sample = available ? `<p class="sample-sound">${item.mode === 'initial' ? '声母呼读音' : '示范读音'}<strong>${item.spoken}</strong><span>${toneName(item.recording)}</span></p>` : '<p class="sample-sound">这个音的独立示范正在补充。</p>';
  return `<section class="vowel-lesson"><div class="vowel-display ${item.color}" aria-hidden="true"><div class="pinyin-lines"><span>${item.symbol}</span></div><span class="vowel-spark">✳</span></div><div class="lesson-copy"><span class="eyebrow">嘴巴和耳朵，一起试试</span><h2>${item.tip}</h2>${sample}<button class="button primary" data-pinyin-play="${item.id}" ${available ? '' : 'disabled'}>${icon('sound')}${available ? (item.mode === 'initial' ? '听呼读音' : '听读音') : '示范音待补充'}</button><p class="small-note">${item.note}</p></div></section>`;
}
function sequenceControls(kind, title) {
  return `<div class="sequence-controls"><button class="button secondary" data-sequence="${kind}">${icon('sound')}${title}</button><button class="button secondary" data-sequence-pause disabled>暂停</button><button class="text-button" data-sequence-stop disabled>停止</button><span data-sequence-status role="status"></span></div>`;
}
function finalLesson() {
  const item = FINALS.find(item => item.id === selectedPinyin.finals);
  return `<p class="small-note">从 a、o、e 开始。点一个就能听，也可以按顺序跟读。</p><div class="final-rows">${FINAL_GROUPS.map(group => `<section class="final-row"><h2>${group.label}</h2>${soundPicker(group.items, group.label, true)}</section>`).join('')}</div>${sequenceControls('finals', '顺序听')}${soundLesson(item)}`;
}
function showSequenceState(status) {
  sequencePaused = status === 'paused';
  const active = status === 'playing' || sequencePaused;
  const pause = document.querySelector('[data-sequence-pause]');
  if (pause) { pause.disabled = !active; pause.textContent = sequencePaused ? '继续' : '暂停'; }
  const stop = document.querySelector('[data-sequence-stop]');
  if (stop) stop.disabled = !active;
  const message = document.querySelector('[data-sequence-status]');
  if (message && status !== 'playing') message.textContent = {paused: '已暂停，可以继续跟读。', done: '这一轮听完啦。', idle: '', error: '播放未完成，请重新点一下。'}[status];
  if (!active) document.querySelectorAll('.tone-card.is-playing').forEach(el => el.classList.remove('is-playing'));
}
async function startPinyinSequence(kind) {
  const candidates = {finals: FINALS, initials: [...INITIALS, ...SPELLING_LETTERS], whole: WHOLE_SYLLABLES, tones: toneExamples(toneBase)}[kind] || [];
  const items = candidates.filter(item => pinyinAudio(item.id)).map(item => ({...item, src: pinyinAudio(item.id)}));
  await audio.playSequence(items, {gap: kind === 'tones' ? 200 : 300, onState: showSequenceState, onItem(item, index, total) {
    if (kind !== 'tones') {
      selectedPinyin[kind] = item.id;
      document.querySelectorAll('[data-pinyin-item]').forEach(el => { const selected = el.dataset.pinyinItem === item.id; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
      document.querySelector('.vowel-lesson').outerHTML = soundLesson(item);
    } else document.querySelectorAll('.tone-card').forEach(el => el.classList.toggle('is-playing', el.dataset.pinyinPlay === item.id));
    const message = document.querySelector('[data-sequence-status]');
    if (message) message.textContent = `正在听 ${item.symbol} · ${index + 1} / ${total}`;
  }});
}
function initialLesson() {
  const item = [...INITIALS, ...SPELLING_LETTERS].find(item => item.id === selectedPinyin.initials);
  return `<h2 class="lesson-section-title">21 个声母</h2><p class="small-note">这里听呼读音，帮助认识声母；拼读时要读得轻、短。</p>${soundPicker(INITIALS, '声母', true)}<h2 class="lesson-section-title">再认识 y 和 w</h2><p class="small-note">它们是拼写字母，单独认识。顺序听会先读声母，再读 y、w。</p>${soundPicker(SPELLING_LETTERS, '拼写字母', true)}${sequenceControls('initials', '顺序听')}${soundLesson(item)}`;
}
function wholeLesson() {
  const item = WHOLE_SYLLABLES.find(item => item.id === selectedPinyin.whole);
  return `<h2 class="lesson-section-title">16 个整体认读音节，整个一起读。</h2>${soundPicker(WHOLE_SYLLABLES, '整体认读音节', true)}${sequenceControls('whole', '顺序听')}${soundLesson(item)}`;
}
function toneLesson() {
  const examples = toneExamples(toneBase);
  return `<div class="tone-intro"><h2>同样的音节，声音走不同的路。</h2><p>选一个音节，再听听它的四声。</p></div><div class="tone-groups" aria-label="选择四声音节">${TONE_GROUPS.map(group => `<section class="tone-group"><h3>${group.label}</h3><div class="lesson-groups tone-picker">${group.bases.map(base => `<button data-tone-base="${base.id}" aria-pressed="${base.id === toneBase}" class="${base.id === toneBase ? 'selected' : ''}">${base.id}</button>`).join('')}</div></section>`).join('')}</div><div class="tone-grid">${examples.map(t => `<button class="tone-card" data-pinyin-play="${t.id}" aria-label="听${t.name}${t.symbol}"><span class="eyebrow">${t.name}</span><svg viewBox="0 0 100 100" aria-hidden="true"><polyline points="${t.points}"/></svg><strong>${t.symbol}</strong><p>${t.tip}</p><span class="tone-listen">${icon('sound')}听一听</span></button>`).join('')}</div>${sequenceControls('tones', '依次听四声')}<p class="small-note">每组完整音节都可以听四声。yi、wu、yu 是 i、u、ü 单独成音节的拼写；wei、you、yue 帮助听复韵音节，dong 带声母 d，不是 ong 的独立发音。这里只听单独声调，不练词语变调或轻声。</p>`;
}
function ensureQuiz() {
  if (quiz) return;
  const current = nextPracticeCategory(state.pinyinScopes, lastQuizScope);
  if (!current) return;
  const available = practicePool(current.id);
  if (available.length < 3) return;
  const answer = Math.floor(Math.random() * available.length);
  lastQuizScope = current.id;
  quiz = {scope: current.id, answer: available[answer], choices: quizChoices(available, answer), chosen: '', correct: false};
}
function quizLesson() {
  ensureQuiz();
  const current = PRACTICE_CATEGORIES.find(group => group.id === quiz?.scope);
  const selected = PRACTICE_CATEGORIES.filter(group => state.pinyinScopes.includes(group.id));
  const controls = `<section class="practice-controls" aria-label="练习设置"><h2>想练哪些朋友？</h2><p class="small-note">可以选多类，再点一次取消。</p><div class="practice-scopes" role="group" aria-label="练习范围">${PRACTICE_CATEGORIES.map(group => `<button data-quiz-scope="${group.id}" aria-pressed="${state.pinyinScopes.includes(group.id)}">${state.pinyinScopes.includes(group.id) ? icon('check') : ''}${group.label}</button>`).join('')}</div><p class="small-note" data-practice-summary>${selected.length ? `已选：${selected.map(group => group.label).join('、')}。每题三个选项。` : '请选择至少一类，再开始听音。'}</p></section>`;
  if (!quiz) return `${controls}<section class="quiz-lesson"><h2>先选一类拼音朋友吧</h2><p>选好范围，就可以听声音找朋友啦。</p></section>`;
  const initialPractice = current.id === 'initials';
  return `${controls}<section class="quiz-lesson"><span class="eyebrow" data-question-scope>这一题 · ${current.label}</span><h2>声音里的朋友，是谁呢？</h2><button class="listen-orb" data-quiz-listen aria-label="播放题目声音">${icon('sound')}</button><p>${initialPractice ? '这里听声母呼读音。先点小喇叭，再选一个。' : '先点小喇叭，再选一个。'}</p><div class="quiz-options">${quiz.choices.map(item => `<button data-answer="${item.id}" class="${quiz.chosen === item.id ? (quiz.correct ? 'correct' : 'retry') : ''}" ${quiz.correct ? 'disabled' : ''} aria-label="选择${item.symbol}">${item.symbol}${quiz.correct && quiz.chosen === item.id ? icon('check') : ''}</button>`).join('')}</div><p class="quiz-feedback" role="status">${quiz.correct ? `找到了！声音里的朋友是 ${quiz.answer.symbol}。` : quiz.chosen ? '再听一听，慢慢找。' : '不着急，可以听很多次。'}</p>${quiz.correct ? '<p class="small-note">' + quiz.answer.note + '</p><button class="button primary" data-next-quiz>再找一个' + icon('arrow') + '</button>' : ''}</section>`;
}

function bookCredit(book) {
  return `<div class="credit-body"><p>文字：${esc(book.credits['Written by'])} · 插图：${esc(book.credits['Illustrated by'])}</p><p>中文翻译：${esc(book.credits['Translated by'])} · 普通话朗读：${esc(book.credits['Read by'])}</p><p><a href="${book.source}" target="_blank" rel="noopener">Storybooks Canada 原文</a> · <a href="${book.licenseUrl}" target="_blank" rel="noopener">${book.license}</a></p><p>文字、插图和录音保持原样，阅读提示与词语解释由本项目编写。${book.license.includes('NC') ? '本书按非商业许可使用。' : ''}</p></div>`;
}
function sourceSummary() {
  const pinyinSources = [...new Map(sources.filter(source => source.kind === 'pinyin').map(source => [JSON.stringify([source.source, source.author, source.license, source.licenseUrl]), source])).values()];
  const platforms = new Map();
  for (const book of books) {
    const url = new URL(book.source), key = url.origin;
    if (!platforms.has(key)) platforms.set(key, {name: url.hostname === 'www.storybookscanada.ca' ? 'Storybooks Canada' : url.hostname, licenses: new Map()});
    platforms.get(key).licenses.set(book.licenseUrl, book.license);
  }
  return `<details class="parent-panel sources"><summary><span>每一本书，都有来处</span><small>查看绘本与声音来源</small></summary><div class="sources-body"><h3>绘本</h3>${[...platforms].map(([url, platform]) => `<p class="source-platform"><a href="${esc(url)}" target="_blank" rel="noopener">${esc(platform.name)}</a> · ${[...platform.licenses].map(([url, label]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`).join(' / ')}</p>`).join('')}<p class="small-note">署名见各书阅读页；标注 NC 的绘本仅限非商业使用。</p><div class="source-audio"><h3>拼音录音</h3>${pinyinSources.map(source => `<p><a href="${source.source}" target="_blank" rel="noopener">${esc(source.author)}</a> · ${source.permission?.status === 'user-confirmed' ? '经授权用于本项目' : source.licenseUrl ? `<a href="${source.licenseUrl}" target="_blank" rel="noopener">${esc(source.license)}</a>` : esc(source.license)}</p>`).join('')}</div></div></details>`;
}
function maintenancePanel() {
  return `<details class="parent-panel app-maintenance parent-disclosure"><summary><span>应用更新</span><small>检查新内容，或重新加载当前页面。</small></summary><div class="maintenance-body"><div class="maintenance-actions"><button class="button secondary" data-app-check>检查更新</button><button class="button secondary" data-app-reload>重新加载页面</button></div><p class="small-note">重新加载会停止当前播放，已保存的阅读记录、生字篮和设置会保留。</p><p id="app-update-status" class="small-note" role="status">${esc(maintenanceMessage)}</p></div></details>`;
}
function paintMaintenance() {
  document.querySelectorAll('[data-download], [data-download-book], #download-scope, [data-app-check], [data-app-reload], [data-app-refetch]').forEach(el => { el.disabled = libraryBusy; });
  for (const [id, text] of [['app-update-status', maintenanceMessage], ['resource-refresh-status', resourceMessage]]) {
    const message = document.getElementById(id);
    if (message) message.textContent = text;
  }
}
function paintDownloadSize() {
  const selection = offlineScope;
  offlineSize(selection).then(size => {
    const el = document.getElementById('download-status');
    if (el && selection === offlineScope && !libraryBusy) el.textContent = `所选资源约 ${size} MB，包含图片与录音。`;
  }).catch(error => { const el = document.getElementById('download-status'); if (el) el.textContent = error.message; });
}
async function downloadSelection(selection, statusId = 'download-status') {
  if (libraryBusy) return;
  audio.stop(); libraryBusy = true; paintMaintenance();
  const report = message => { const el = document.getElementById(statusId); if (el) el.textContent = message; };
  report('正在准备下载，请保持页面打开…');
  try {
    const label = await downloadLibrary((done, total) => report(`正在下载 ${done} / ${total} 项，请保持页面打开…`), selection);
    report(`已下载${label}，可离线使用。`); notify('下载好了，可以断网试读啦。');
  } catch (error) { report(`下载未完成：${error.message}`); notify(error.message); }
  finally { libraryBusy = false; paintMaintenance(); }
}
async function maintainApp(action) {
  if (libraryBusy) return;
  audio.stop(); libraryBusy = true;
  const report = message => { if (action === 'refetch') resourceMessage = message; else maintenanceMessage = message; paintMaintenance(); };
  report(action === 'refetch' ? '正在重新获取资源，请保持页面打开…' : action === 'reload' ? '正在准备重新加载…' : '正在检查更新…');
  try {
    if (action === 'check') {
      const result = await checkForUpdate();
      report(result.available ? '新版已准备好，点击“重新加载页面”启用。' : '当前已是最新版本。');
    } else if (action === 'reload') {
      await prepareReload(); location.reload();
    } else {
      await refreshLibrary((done, total) => report(`正在重新获取资源 ${done} / ${total}，请保持页面打开…`));
      report('资源已重新获取并校验，可离线使用。');
    }
  } catch (error) {
    report(error.name === 'QuotaExceededError' ? '设备空间暂时不够，学习记录保留。请释放空间后重试。' : error.message === 'Failed to fetch' || error instanceof TypeError ? '暂时无法获取新内容，请检查网络后重试。学习记录保留。' : error.message);
  } finally { libraryBusy = false; paintMaintenance(); }
}
function parent() {
  return shell('parent', `<header class="page-header"><div><span class="eyebrow">家长小角</span><h1>陪她读，也给她一点空间。</h1></div></header><section class="parent-panel"><h2>阅读和声音</h2><p>正文不加拼音，先看图、自己读，遇到困难再求助。拼音在独立的小课堂学习。</p><label for="voice-select" class="voice-label">点字词时使用的设备中文声音</label><select id="voice-select"><option value="">自动选择普通话声音</option>${chineseVoices().map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === state.voice ? 'selected' : ''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select><button class="button secondary" data-voice-test>${icon('sound')}试听中文声音</button><p class="small-note">故事和拼音读音使用随站录音；单独词语使用设备语音。没有可用中文声音时，仍可听故事原句。设备语音可能需要联网。</p></section>
    <section class="parent-panel offline-panel"><h2>带上故事，离线也能读</h2><p>第一次联网打开后，可按书、按级别下载，也可带上全部${books.length}本绘本和拼音读音。下载完成后，请在这台 iPad 上试一次断网阅读。</p><label class="voice-label" for="download-scope">离线下载范围</label><select id="download-scope"><option value="all" ${offlineScope === 'all' ? 'selected' : ''}>全部故事与拼音</option><option value="pinyin" ${offlineScope === 'pinyin' ? 'selected' : ''}>拼音读音</option><optgroup label="按级别">${[1,2,3,4,5].map(level => `<option value="level:${level}" ${offlineScope === `level:${level}` ? 'selected' : ''}>${level}级 · ${books.filter(book => book.sourceLevel.value === level).length}本</option>`).join('')}</optgroup><optgroup label="按图书">${books.map(book => `<option value="book:${book.id}" ${offlineScope === `book:${book.id}` ? 'selected' : ''}>${esc(book.title)}</option>`).join('')}</optgroup></select><button class="button primary" data-download>${icon('download')}下载离线故事包</button><p id="download-status" role="status" class="small-note">正在计算素材大小…</p><p class="small-note">Safari 中点“分享 → 添加到主屏幕”，即可像小应用一样打开。浏览器清理缓存后需要重新下载。</p><div class="resource-repair"><p class="small-note">图片或声音异常？联网重新获取完整资源包，学习记录会保留。</p><button class="text-button" data-app-refetch>重新获取资源</button><p id="resource-refresh-status" class="small-note" role="status">${esc(resourceMessage)}</p></div></section>
    <section class="parent-panel"><h2>这份小书架的边界</h2><p>当前包含${books.length}本绘本、24个韵母、21个声母、拼写字母y/w、16个整体认读音节和${TONE_BASES.length}组音节的四声；主要示范音来自CLI拼音表，ong独立录音来自ChinaHelp，均可随离线包播放。声母采用呼读音，页面明确标注；这不是单独本音录音。ong使用家长试听选定的独立示范，不再借用hong或dong。分类参考新版教材，尚不包含系统拼读课程，内容未经教师逐项审听。</p><p>阅读位置、“读完”标记、生字篮和偏好只保存在本机；没有账号、分析追踪或跨设备同步。不把“读完”当作认字掌握证明。</p>${storageWarning ? '<p class="warning">当前浏览器保存失败，本次记录可能无法保留。</p>' : ''}<button class="text-button danger" data-reset>清除本机阅读记录和生字篮</button></section>
    ${maintenancePanel()}${sourceSummary()}`);
}

function render() {
  audio.stop();
  if (wordDialog.open) wordDialog.close();
  if (parentDialog.open) closeParent();
  route = routeFromHash(location.hash, books);
  const needsParentGate = route.section === 'parent' && !parentAccess;
  if (needsParentGate) {
    history.replaceState(null, '', lastPublicHash);
    route = routeFromHash(lastPublicHash, books);
  }
  if (route.section !== 'parent') { parentAccess = false; lastPublicHash = location.hash || '#/shelf'; }
  if (route.section === 'book') persist(updateProgress(state, route.book, route.page));
  app.innerHTML = route.section === 'book' ? reader() : route.section === 'pinyin' ? pinyin() : route.section === 'words' ? words() : route.section === 'parent' ? parent() : shelf();
  document.title = `${route.section === 'book' ? route.book.title : route.section === 'pinyin' ? '学拼音' : route.section === 'words' ? '我的生字' : route.section === 'parent' ? '家长小角' : '故事书架'} · 阅读小花园`;
  paintMaintenance();
  if (route.section === 'parent') {
    paintDownloadSize();
  }
  if (needsParentGate) requestParent();
}

app.addEventListener('click', async event => {
  if (event.target.closest('a[href="#/parent"]') && route.section !== 'parent') { event.preventDefault(); requestParent(); return; }
  const el = event.target.closest('button');
  if (!el || el.disabled) return;
  if (el.hasAttribute('data-book-level')) { bookLevel = el.dataset.bookLevel; render(); }
  else if (el.hasAttribute('data-prev')) go(`#/book/${route.book.id}/${route.page}`);
  else if (el.hasAttribute('data-next')) { audio.stop(); if (route.page === route.book.pages.length - 1) completion(); else go(`#/book/${route.book.id}/${route.page + 2}`); }
  else if (el.hasAttribute('data-page')) go(`#/book/${route.book.id}/${Number(el.dataset.page) + 1}`);
  else if (el.hasAttribute('data-page-play')) { if (audio.playing) audio.stop(); else await play(route.book.pages[route.page].audio); }
  else if (el.hasAttribute('data-char')) showWord(Number(el.dataset.char));
  else if (el.hasAttribute('data-saved-word')) showWord(0, state.words[Number(el.dataset.savedWord)]);
  else if (el.hasAttribute('data-remove-word')) { persist({...state, words: state.words.filter((_, i) => i !== Number(el.dataset.removeWord))}); render(); }
  else if (el.hasAttribute('data-pinyin-tab')) { pinyinTab = el.dataset.pinyinTab; render(); }
  else if (el.hasAttribute('data-pinyin-item')) { selectedPinyin[pinyinTab] = el.dataset.pinyinItem; render(); await playPinyin(el.dataset.pinyinItem); }
  else if (el.hasAttribute('data-quiz-scope')) {
    const id = el.dataset.quizScope;
    if (!PRACTICE_CATEGORIES.some(group => group.id === id)) return;
    const scopes = state.pinyinScopes.includes(id) ? state.pinyinScopes.filter(scope => scope !== id) : [...state.pinyinScopes, id];
    persist({...state, pinyinScopes: scopes}); quiz = null; lastQuizScope = ''; render();
  }
  else if (el.hasAttribute('data-tone-base')) { toneBase = el.dataset.toneBase; render(); }
  else if (el.hasAttribute('data-sequence')) await startPinyinSequence(el.dataset.sequence);
  else if (el.hasAttribute('data-sequence-pause')) { if (sequencePaused) await audio.resumeSequence(); else audio.pauseSequence(); }
  else if (el.hasAttribute('data-sequence-stop')) audio.stop();
  else if (el.hasAttribute('data-pinyin-play')) await playPinyin(el.dataset.pinyinPlay);
  else if (el.hasAttribute('data-quiz-listen')) await playPinyin(quiz.answer.id);
  else if (el.hasAttribute('data-answer')) { quiz.chosen = el.dataset.answer; quiz.correct = quiz.chosen === quiz.answer.id; render(); if (!quiz.correct) await playPinyin(quiz.answer.id); }
  else if (el.hasAttribute('data-next-quiz')) { quiz = null; render(); }
  else if (el.hasAttribute('data-voice-test')) { if (!audio.speak('你好，欢迎来到阅读小花园。', state.voice)) notify('设备暂时没有可用的中文声音，请在 iPad 设置中添加普通话语音。'); }
  else if (el.hasAttribute('data-app-check')) await maintainApp('check');
  else if (el.hasAttribute('data-app-reload')) await maintainApp('reload');
  else if (el.hasAttribute('data-app-refetch')) await maintainApp('refetch');
  else if (el.hasAttribute('data-download-book')) await downloadSelection(`book:${el.dataset.downloadBook}`, 'book-download-status');
  else if (el.hasAttribute('data-download')) await downloadSelection(offlineScope);
  else if (el.hasAttribute('data-reset')) {
    confirmDialog.innerHTML = `<h2 id="confirm-title">清除本机学习记录？</h2><p>阅读位置、读完标记、生字篮和偏好都会删除。离线故事包仍保留。</p><div class="dialog-actions"><button class="button secondary" data-cancel-reset>保留记录</button><button class="button primary" data-confirm-reset>确认清除</button></div>`; confirmDialog.showModal();
  }
});

app.addEventListener('change', event => {
  if (event.target.id === 'book-theme') { bookFilter = event.target.value; render(); }
  if (event.target.id === 'download-scope') { offlineScope = event.target.value; paintDownloadSize(); }
  if (event.target.id === 'voice-select') persist({...state, voice: event.target.value});
});
wordDialog.addEventListener('click', async event => {
  const el = event.target.closest('button'); if (!el) return;
  if (el.hasAttribute('data-close')) { audio.stop(); wordDialog.close(); }
  else if (el.hasAttribute('data-word-listen')) { const book = books.find(b => b.id === selectedWord.bookId); await play(book.pages[selectedWord.page].audio); }
  else if (el.hasAttribute('data-save-word')) {
    const saved = state.words.some(w => w.char === selectedWord.char) || persist({...state, words: [...state.words, selectedWord].slice(-200)});
    el.disabled = true; el.innerHTML = icon('check') + (saved ? '已放进生字篮' : '本次先收好');
    if (saved) notify('这个字已经收好啦。');
  } else if (el.hasAttribute('data-speak-word')) {
    const text = books.find(b => b.id === selectedWord.bookId).pages[selectedWord.page].text;
    const context = wordInContext(text, text.indexOf(selectedWord.char));
    if (!audio.speak(context.word, state.voice)) { notify('暂时没有中文词语声音，先听故事原句吧。'); await play(books.find(b => b.id === selectedWord.bookId).pages[selectedWord.page].audio); }
  }
});
wordDialog.addEventListener('close', () => audio.stop());
confirmDialog.addEventListener('click', event => {
  if (event.target.closest('[data-cancel-reset]')) confirmDialog.close();
  if (event.target.closest('[data-confirm-reset]')) { audio.stop(); if (persist(emptyState())) { quiz = null; lastQuizScope = ''; confirmDialog.close(); render(); notify('本机记录已清除。'); } }
});
parentDialog.addEventListener('click', event => { if (event.target.closest('[data-cancel-parent]')) closeParent(); });
parentDialog.addEventListener('close', () => {
  // A close event from the previous opening may arrive after a new hold has begun.
  if (!parentDialog.open) { disposeParentHold?.(); disposeParentHold = null; }
});
parentDialog.addEventListener('cancel', () => { disposeParentHold?.(); disposeParentHold = null; });
document.addEventListener('visibilitychange', () => { if (document.hidden) audio.stop(); });
window.addEventListener('pagehide', () => audio.stop());
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); document.querySelector('#main')?.focus({preventScroll: true}); });
document.addEventListener('keydown', event => {
  if (route?.section !== 'book' || wordDialog.open || confirmDialog.open || event.target.matches('input,select,textarea,button,a')) return;
  if (event.key === 'ArrowRight') app.querySelector('[data-next]')?.click();
  if (event.key === 'ArrowLeft') app.querySelector('[data-prev]')?.click();
});
globalThis.speechSynthesis?.addEventListener('voiceschanged', () => {
  const select = document.querySelector('#voice-select');
  if (select) select.innerHTML = `<option value="">自动选择普通话声音</option>${chineseVoices().map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === state.voice ? 'selected' : ''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}`;
});

async function boot() {
  try {
    const [bookResponse, sourceResponse] = await Promise.all([fetch(new URL('data/books.json', document.baseURI)), fetch(new URL('assets/sources.json', document.baseURI))]);
    if (!bookResponse.ok || !sourceResponse.ok) throw Error('Content unavailable');
    books = await bookResponse.json(); sources = (await sourceResponse.json()).sources;
    try { state = normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)), books); }
    catch { state = emptyState(); }
    render(); registerOffline().catch(() => {});
  } catch {
    app.innerHTML = '<main class="empty-state"><h1>小花园暂时没有打开</h1><p>请检查网络后重新打开。如果是首次访问，需要先联网下载故事。</p><button class="button primary" id="retry">重新打开</button></main>';
    document.querySelector('#retry').addEventListener('click', () => location.reload());
  }
}
boot();
