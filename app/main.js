import {STORAGE_KEY, emptyState, normalizeState, routeFromHash, updateProgress, wordInContext, quizChoices} from './core.js';
import {VOWELS, TONES, pinyinAudio, listeningVowels} from './pinyin.js';
import {AudioPlayer, chineseVoices} from './audio.js';
import {downloadLibrary, offlineSize, registerOffline} from './offline.js';

const app = document.querySelector('#app');
const wordDialog = document.querySelector('#word-dialog');
const confirmDialog = document.querySelector('#confirm-dialog');
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
let selectedVowel = 'a', pinyinTab = 'vowels', quiz = null, selectedWord = null;
let bookFilter = '全部故事', toastTimer, storageWarning = false;
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
  return shell('shelf', `<header class="page-header"><div><span class="eyebrow">故事书架</span><h1>今天，也读一个好故事。</h1></div><span class="header-note">${icon('leaf')}从一页开始</span></header>
    <section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="pill">${hasProgress ? '接着上次的故事' : '从这本开始吧'}</span><h2 id="hero-title">小小的书，<br>大大的世界<span class="sun-dot" aria-hidden="true">✳</span></h2><p>${esc(last.intro)}</p><a class="button primary" href="${bookLink(last)}">${hasProgress ? '继续阅读' : '打开故事'}${icon('arrow')}</a><span class="hero-caption">${esc(last.title)} · ${last.pages.length}页图画故事</span></div><a class="hero-art" href="${bookLink(last)}" aria-label="阅读${esc(last.title)}"><span class="art-orbit" aria-hidden="true"></span><img src="${last.cover}" alt="${esc(last.title)}的绘本封面"><span class="floating-label">翻开一页，遇见惊喜</span></a></section>
    <section class="bookshelf" aria-labelledby="shelf-heading"><div class="section-heading"><div><h2 id="shelf-heading">选一本，慢慢读</h2><p>看图、读故事，遇到生字就点一下。</p></div><span class="small-note">${books.length}本精选绘本</span></div><div class="filters" aria-label="故事分类">${['全部故事', '动物朋友', '家人与我', '找一找'].map(f => `<button data-filter="${f}" class="filter ${bookFilter === f ? 'selected' : ''}" aria-pressed="${bookFilter === f}">${f}</button>`).join('')}</div><div class="book-grid">${books.filter(b => bookFilter === '全部故事' || b.tag === bookFilter).map(bookCard).join('')}</div></section>
    <a class="pinyin-banner" href="#/pinyin"><div class="letter-garden" aria-hidden="true"><span>a</span><span>o</span><span>e</span></div><div><span class="eyebrow">独立的小课堂</span><h2>和拼音交个朋友</h2><p>先听一听，再试着读。不用会拼音，也能读故事。</p></div><span class="round-arrow">${icon('arrow')}</span></a>
    <footer class="site-footer">每个孩子都有自己的阅读节奏。<a href="#/parent">故事与声音来源</a></footer>`);
}
function bookCard(book) {
  const p = state.progress[book.id];
  return `<a class="book-card ${book.color}" href="${bookLink(book)}"><div class="book-cover"><img src="${book.cover}" alt="${esc(book.title)}" loading="lazy"><span class="book-status">${p?.finished ? '读过啦' : p ? `读到第${p.page + 1}页` : '打开看看'}</span></div><div class="book-info"><span class="book-category">${book.tag} <span>· ${book.pages.length}页</span></span><h3>${esc(book.title)}</h3><p>${esc(book.intro)}</p><span class="read-link">${p ? '继续读' : '开始读'}${icon('arrow')}</span></div></a>`;
}

function reader() {
  const {book, page} = route, current = book.pages[page];
  const chars = Array.from(current.text).map((char, index) => /\p{Script=Han}/u.test(char) ? `<button class="character" data-char="${index}" aria-label="认识${esc(char)}">${esc(char)}</button>` : `<span>${esc(char)}</span>`).join('');
  return `<main class="reader ${state.largeText ? 'large-text' : ''}" id="main"><header class="reader-header"><a href="#/shelf" class="back-link">${icon('back')}回到书架</a><h1>${esc(book.title)}</h1><button class="text-size secondary" data-size aria-pressed="${state.largeText}" aria-label="切换大字阅读">字<span>${state.largeText ? '标准' : '放大'}</span></button></header>
    <div class="reading-progress" aria-label="阅读进度"><span style="width:${(page + 1) / book.pages.length * 100}%"></span></div>
    <section class="reading-spread" aria-label="第${page + 1}页"><div class="page-art"><img src="${current.image}" alt="故事插图：${esc(current.text)}"></div><div class="page-words"><span class="eyebrow">第 ${page + 1} 页 / 共 ${book.pages.length} 页</span><p class="story-text" aria-label="${esc(current.text)}">${chars}</p><button class="button primary play-page" data-page-play aria-pressed="false">${icon('sound')}读这一页</button><p class="reading-hint">遇到不认识的字，点一下就能求助。</p></div></section>
    <nav class="page-controls" aria-label="翻页"><button class="button secondary" data-prev ${page === 0 ? 'disabled' : ''}>${icon('back')}上一页</button><div class="page-dots">${book.pages.map((_, i) => `<button class="page-dot ${i === page ? 'current' : ''}" data-page="${i}" aria-label="第${i + 1}页" ${i === page ? 'aria-current="page"' : ''}><span></span></button>`).join('')}</div><button class="button ${page === book.pages.length - 1 ? 'primary' : 'secondary'}" data-next>${page === book.pages.length - 1 ? '读完啦' : '下一页'}${icon(page === book.pages.length - 1 ? 'check' : 'arrow')}</button></nav>
    <details class="reader-credit"><summary>这本书的作者与来源</summary>${bookCredit(book)}</details></main>`;
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
  return shell('pinyin', `<header class="page-header"><div><span class="eyebrow">拼音小课堂 · 入门第一课</span><h1>听听声音，动动小嘴巴。</h1></div><span class="header-note">${icon('sun')}和家长一起学</span></header><p class="page-description">从单韵母和四声开始，一次认识一点点。</p><div class="lesson-tabs" aria-label="拼音活动">${[['vowels', '认识单韵母'], ['tones', '听听四声'], ['quiz', '听音找朋友']].map(([id, title]) => `<button data-pinyin-tab="${id}" class="${pinyinTab === id ? 'selected' : ''}" aria-pressed="${pinyinTab === id}">${title}</button>`).join('')}</div>${pinyinTab === 'vowels' ? vowelLesson() : pinyinTab === 'tones' ? toneLesson() : quizLesson()}<p class="lesson-note">这里学习拼音，故事里安心读汉字。两边可以随时切换。</p>`);
}
function vowelLesson() {
  const v = VOWELS.find(v => v.id === selectedVowel);
  return `<div class="vowel-picker" aria-label="选择单韵母">${VOWELS.map(v => `<button data-vowel="${v.id}" class="${v.color} ${v.id === selectedVowel ? 'selected' : ''}" aria-label="单韵母${v.symbol}" aria-pressed="${v.id === selectedVowel}">${v.symbol}</button>`).join('')}</div><section class="vowel-lesson"><div class="vowel-display ${v.color}" aria-hidden="true"><div class="pinyin-lines"><span>${v.symbol}</span></div><span class="vowel-spark">✳</span></div><div class="lesson-copy"><span class="eyebrow">嘴巴和耳朵，一起试试</span><h2>${v.tip}</h2><p class="example-word">听例字：<strong>${v.example}</strong><span>${v.spelling}</span></p><button class="button primary" data-pinyin-play="${v.id}" ${pinyinAudio(v.id) ? '' : 'disabled'}>${icon('sound')}${pinyinAudio(v.id) ? '听听例字' : '示范音待补充'}</button><p class="small-note">例字带有声调。先听声音，再和家长一起试着读。</p></div></section>`;
}
function toneLesson() {
  return `<div class="tone-intro"><h2>同样的 ba，声音走不同的路。</h2><p>用手指跟着线条走一走，再点一下听例字。</p></div><div class="tone-grid">${TONES.map(t => `<button class="tone-card" data-pinyin-play="${t.id}" ${pinyinAudio(t.id) ? '' : 'disabled'} aria-label="听${t.name}${t.symbol}"><span class="eyebrow">${t.name}</span><svg viewBox="0 0 100 100" aria-hidden="true"><polyline points="${t.points}"/></svg><strong>${t.symbol}</strong><span>${t.example}</span><p>${t.tip}</p><span class="tone-listen">${icon('sound')}${pinyinAudio(t.id) ? '听一听' : '示范音待补充'}</span></button>`).join('')}</div><p class="small-note">这里练习单独读音。进入词语和句子后，有些声调会发生变化。</p>`;
}
function ensureQuiz() {
  if (quiz) return;
  const available = listeningVowels();
  if (available.length < 2) return;
  const answer = Math.floor(Math.random() * available.length);
  quiz = {answer: available[answer], choices: quizChoices(available, answer), chosen: '', correct: false};
}
function quizLesson() {
  ensureQuiz();
  if (!quiz) return '<section class="quiz-lesson"><h2>先和家长一起读一读</h2><p>示范音补充后，再来听音找朋友。</p></section>';
  return `<section class="quiz-lesson"><span class="eyebrow">听例字，找出它的单韵母</span><h2>声音里的朋友，是谁呢？</h2><button class="listen-orb" data-quiz-listen aria-label="播放题目声音">${icon('sound')}</button><p>先点小喇叭，再选一个。</p><div class="quiz-options">${quiz.choices.map(v => `<button data-answer="${v.id}" class="${quiz.chosen === v.id ? (quiz.correct ? 'correct' : 'retry') : ''}" ${quiz.correct ? 'disabled' : ''} aria-label="选择${v.symbol}">${v.symbol}${quiz.correct && quiz.chosen === v.id ? icon('check') : ''}</button>`).join('')}</div><p class="quiz-feedback" role="status">${quiz.correct ? `找到了！“${quiz.answer.example}”里的单韵母是 ${quiz.answer.symbol}。` : quiz.chosen ? '再听一听，慢慢找。' : '不着急，可以听很多次。'}</p>${quiz.correct ? '<button class="button primary" data-next-quiz>再找一个' + icon('arrow') + '</button>' : ''}</section>`;
}

function bookCredit(book) {
  return `<div class="credit-body"><p>文字：${esc(book.credits['Written by'])} · 插图：${esc(book.credits['Illustrated by'])}</p><p>中文翻译：${esc(book.credits['Translated by'])} · 普通话朗读：${esc(book.credits['Read by'])}</p><p><a href="${book.source}" target="_blank" rel="noopener">Storybooks Canada 原文</a> · <a href="${book.licenseUrl}" target="_blank" rel="noopener">${book.license}</a></p><p>文字、插图和录音保持原样，阅读提示与词语解释由本项目编写。${book.license.includes('NC') ? '本书按非商业许可使用。' : ''}</p></div>`;
}
function parent() {
  return shell('parent', `<header class="page-header"><div><span class="eyebrow">家长小角</span><h1>陪她读，也给她一点空间。</h1></div></header><section class="parent-panel"><h2>阅读和声音</h2><p>正文不加拼音，先看图、自己读，遇到困难再求助。拼音在独立的小课堂学习。</p><label class="setting-row" for="large-text"><span>使用更大的正文字体</span><input id="large-text" type="checkbox" ${state.largeText ? 'checked' : ''}></label><label for="voice-select" class="voice-label">点字词时使用的设备中文声音</label><select id="voice-select"><option value="">自动选择普通话声音</option>${chineseVoices().map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === state.voice ? 'selected' : ''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select><button class="button secondary" data-voice-test>${icon('sound')}试听中文声音</button><p class="small-note">故事和拼音例字使用随站录音；单独词语使用设备语音。没有可用中文声音时，仍可听故事原句。设备语音可能需要联网。</p></section>
    <section class="parent-panel"><h2>带上故事，离线也能读</h2><p>第一次联网打开后，可下载全部三本绘本和拼音例字。下载完成后，请在这台 iPad 上试一次断网阅读。</p><button class="button primary" data-download>${icon('download')}下载离线故事包</button><p id="download-status" role="status" class="small-note">正在计算素材大小…</p><p class="small-note">Safari 中点“分享 → 添加到主屏幕”，即可像小应用一样打开。浏览器清理缓存后需要重新下载。</p></section>
    <section class="parent-panel"><h2>这份小书架的边界</h2><p>当前包含3本绘本、6个单韵母和 ba 四声的入门内容；部分示范音正在补充，这些音不会进入听音题。拼音是入门练习，尚不包含完整声母、复韵母和系统拼读课程；例字录音与课程未经教师逐项审听。</p><p>阅读位置、“读完”标记、生字篮和偏好只保存在本机；没有账号、分析追踪或跨设备同步。不把“读完”当作认字掌握证明。</p>${storageWarning ? '<p class="warning">当前浏览器保存失败，本次记录可能无法保留。</p>' : ''}<button class="text-button danger" data-reset>清除本机阅读记录和生字篮</button></section>
    <section class="parent-panel sources"><h2>每一本书，都有来处</h2><p>感谢作者、绘者、翻译者与朗读者，让故事走得更远。</p>${books.map(b => `<details><summary>${esc(b.title)} <span>${b.license}</span></summary>${bookCredit(b)}</details>`).join('')}<details><summary>拼音例字录音与许可</summary>${sources.filter(s => s.kind === 'pinyin').map(s => `<div class="credit-body"><p><a href="${s.source}" target="_blank" rel="noopener">${esc(s.id)} · ${esc(s.author)}</a></p><p><a href="${s.licenseUrl}" target="_blank" rel="noopener">${esc(s.license)}</a> · ${esc(s.changes)}</p></div>`).join('')}<p>字母 i、u、ü 的完整音节通过例字“一、屋、鱼”听读，完整音节分别写作 yī、wū、yú。</p></details></section>`);
}

function render() {
  audio.stop();
  if (wordDialog.open) wordDialog.close();
  route = routeFromHash(location.hash, books);
  if (route.section === 'book') persist(updateProgress(state, route.book, route.page));
  app.innerHTML = route.section === 'book' ? reader() : route.section === 'pinyin' ? pinyin() : route.section === 'words' ? words() : route.section === 'parent' ? parent() : shelf();
  document.title = `${route.section === 'book' ? route.book.title : route.section === 'pinyin' ? '学拼音' : route.section === 'words' ? '我的生字' : route.section === 'parent' ? '家长小角' : '故事书架'} · 阅读小花园`;
  if (route.section === 'parent') offlineSize().then(size => { const el = document.querySelector('#download-status'); if (el) el.textContent = `完整故事包约 ${size} MB，包含图片与录音。`; }).catch(() => {});
}

app.addEventListener('click', async event => {
  const el = event.target.closest('button');
  if (!el || el.disabled) return;
  if (el.hasAttribute('data-filter')) { bookFilter = el.dataset.filter; render(); }
  else if (el.hasAttribute('data-prev')) go(`#/book/${route.book.id}/${route.page}`);
  else if (el.hasAttribute('data-next')) { audio.stop(); if (route.page === route.book.pages.length - 1) completion(); else go(`#/book/${route.book.id}/${route.page + 2}`); }
  else if (el.hasAttribute('data-page')) go(`#/book/${route.book.id}/${Number(el.dataset.page) + 1}`);
  else if (el.hasAttribute('data-page-play')) { if (audio.playing) audio.stop(); else await play(route.book.pages[route.page].audio); }
  else if (el.hasAttribute('data-char')) showWord(Number(el.dataset.char));
  else if (el.hasAttribute('data-size')) { persist({...state, largeText: !state.largeText}); render(); }
  else if (el.hasAttribute('data-saved-word')) showWord(0, state.words[Number(el.dataset.savedWord)]);
  else if (el.hasAttribute('data-remove-word')) { persist({...state, words: state.words.filter((_, i) => i !== Number(el.dataset.removeWord))}); render(); }
  else if (el.hasAttribute('data-pinyin-tab')) { pinyinTab = el.dataset.pinyinTab; render(); }
  else if (el.hasAttribute('data-vowel')) { selectedVowel = el.dataset.vowel; render(); }
  else if (el.hasAttribute('data-pinyin-play')) await playPinyin(el.dataset.pinyinPlay);
  else if (el.hasAttribute('data-quiz-listen')) await playPinyin(quiz.answer.id);
  else if (el.hasAttribute('data-answer')) { quiz.chosen = el.dataset.answer; quiz.correct = quiz.chosen === quiz.answer.id; render(); if (!quiz.correct) await playPinyin(quiz.answer.id); }
  else if (el.hasAttribute('data-next-quiz')) { quiz = null; render(); }
  else if (el.hasAttribute('data-voice-test')) { if (!audio.speak('你好，欢迎来到阅读小花园。', state.voice)) notify('设备暂时没有可用的中文声音，请在 iPad 设置中添加普通话语音。'); }
  else if (el.hasAttribute('data-download')) {
    el.disabled = true;
    try { await downloadLibrary((done, total) => { const status = document.querySelector('#download-status'); if (status) status.textContent = `正在下载 ${done} / ${total} 项，请保持页面打开…`; }); notify('故事包下载好了，可以断网试读啦。'); const status = document.querySelector('#download-status'); if (status) status.textContent = '已下载全部故事与拼音例字，可离线使用。'; }
    catch (error) { notify(error.message); const status = document.querySelector('#download-status'); if (status) status.textContent = '下载未完成。检查网络后再试，已下载的素材会保留。'; }
    finally { el.disabled = false; }
  } else if (el.hasAttribute('data-reset')) {
    confirmDialog.innerHTML = `<h2 id="confirm-title">清除本机学习记录？</h2><p>阅读位置、读完标记、生字篮和偏好都会删除。离线故事包仍保留。</p><div class="dialog-actions"><button class="button secondary" data-cancel-reset>保留记录</button><button class="button primary" data-confirm-reset>确认清除</button></div>`; confirmDialog.showModal();
  }
});

app.addEventListener('change', event => {
  if (event.target.id === 'large-text') persist({...state, largeText: event.target.checked});
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
  if (event.target.closest('[data-confirm-reset]')) { audio.stop(); if (persist(emptyState())) { confirmDialog.close(); render(); notify('本机记录已清除。'); } }
});
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
