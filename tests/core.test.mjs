import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {emptyState, normalizeState, routeFromHash, updateProgress, wordInContext, quizChoices} from '../app/core.js';
import {FINALS, INITIALS, SPELLING_LETTERS, WHOLE_SYLLABLES, PINYIN_ITEMS, PRACTICE_GROUPS, PRACTICE_CATEGORIES, practicePool, nextPracticeCategory, TONE_BASES, toneExamples, TONES, PINYIN_RECORDINGS, pinyinAudio, listeningItems, toneName} from '../app/pinyin.js';

const books = JSON.parse(await readFile(new URL('../data/books.json', import.meta.url)));
test('invalid saved data cannot break reading or inject unknown content', () => {
  const state = normalizeState({progress: {'0087': {page: 900, finished: 'yes'}, unknown: {page: 0}}, words: [null, {char: '<script>', bookId: '0087', page: 0}, {char: '我', bookId: '0087', page: 0}, {char: '我', bookId: '0087', page: 1}], voice: {}, largeText: true}, books);
  assert.equal(state.progress['0087'].page, 7);
  assert.equal(state.progress['0087'].finished, false);
  assert.equal(state.progress.unknown, undefined);
  assert.deepEqual(state.words, [{char: '我', bookId: '0087', page: 0}]);
  assert.equal(state.voice, '');
  assert.equal('largeText' in state, false);
  assert.deepEqual(normalizeState(null, books), emptyState());
});
test('removing the legacy font preference preserves learning records and other preferences', () => {
  const saved = {progress: {'0087': {page: 3, finished: true, updated: 12}}, words: [{char: '我', bookId: '0087', page: 0}], voice: 'Mandarin', readingHelpSeen: false, pinyinScopes: ['initials', 'whole']};
  assert.deepEqual(normalizeState({...saved, largeText: true}, books), saved);
  assert.deepEqual(normalizeState({...saved, largeText: false}, books), saved);
});
test('route bounds and invalid links fall back safely', () => {
  assert.equal(routeFromHash('#/book/0087/999', books).page, 7);
  assert.equal(routeFromHash('#/book/0087/-2', books).page, 0);
  assert.equal(routeFromHash('#/book/missing/1', books).section, 'shelf');
  assert.equal(routeFromHash('#/pinyin', books).section, 'pinyin');
});
test('visiting the final page is distinct from marking a book finished', () => {
  const book = books[0];
  let state = updateProgress(emptyState(), book, 7, false, 1);
  assert.equal(state.progress[book.id].finished, false);
  state = updateProgress(state, book, 7, true, 2);
  state = updateProgress(state, book, 0, false, 3);
  assert.equal(state.progress[book.id].finished, true);
  assert.equal(state.progress[book.id].page, 0);
  assert.equal(state.progress[book.id].updated, 3);
});
test('character help uses the selected occurrence and its contextual word', () => {
  assert.equal(wordInContext('是不是在床底下？', 5).word, '床底下');
  assert.equal(wordInContext('妈妈和奶奶正在忙。', 4).word, '奶奶');
  assert.equal(wordInContext('我喜欢看书。', 4).word, '看书');
});
test('listening choices stay within one group with distinct sounds and exactly one answer', () => {
  for (const group of PRACTICE_GROUPS) {
    const available = listeningItems(group.id);
    assert.equal(new Set(available.map(item => item.recording)).size, available.length, group.id);
    for (let i = 0; i < available.length; i++) {
      const choices = quizChoices(available, i, () => 0.3);
      assert.equal(choices.length, Math.min(3, available.length));
      assert.equal(new Set(choices.map(c => c.id)).size, choices.length);
      assert.equal(choices.filter(c => c.id === available[i].id).length, 1);
      assert.ok(choices.every(item => available.some(a => a.id === item.id)));
    }
  }
});
test('all story pages have intact, decodable local image/audio and per-book credits', async () => {
  assert.equal(books.length, 40);
  assert.equal(books.reduce((sum, book) => sum + book.pages.length, 0), 420);
  for (const book of books) {
    assert.match(book.licenseUrl, /^https:\/\/creativecommons.org\/licenses\//);
    for (const role of ['Written by', 'Illustrated by', 'Translated by', 'Read by']) assert.ok(book.credits[role], role);
    for (const page of book.pages) {
      assert.match(page.text, /\p{Script=Han}/u);
      for (const file of [page.image, page.audio]) {
        const path = new URL(`../${file}`, import.meta.url);
        const bytes = await readFile(path);
        assert.ok(bytes.length > 500);
        const duration = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path.pathname], {encoding: 'utf8'});
        if (file.endsWith('.mp3')) assert.ok(Number(duration) > 0.2, file);
      }
    }
  }
});
test('the full pinyin inventory has distinct IDs, correctly marked samples and no unknown audio', () => {
  assert.deepEqual(FINALS.map(item => item.symbol), ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er', 'an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong']);
  assert.deepEqual(INITIALS.map(item => item.symbol), 'b p m f d t n l g k h j q x zh ch sh r z c s'.split(' '));
  assert.deepEqual(SPELLING_LETTERS.map(item => item.symbol), ['y', 'w']);
  assert.deepEqual(WHOLE_SYLLABLES.map(item => item.symbol), 'zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying'.split(' '));
  assert.equal(PINYIN_ITEMS.length, 63);
  assert.equal(new Set([...PINYIN_ITEMS, ...TONES].map(item => item.id)).size, 143);
  for (const id of ['unknown', '__proto__', 'constructor']) assert.equal(pinyinAudio(id), null);
  assert.deepEqual(listeningItems('unknown'), []);
  for (const item of PINYIN_ITEMS.filter(item => item.recording)) {
    assert.equal(item.spoken.normalize('NFD').replace(/[\u0300\u0301\u0304\u030c]/g, ''), item.recording.slice(0, -1));
    const marks = ['āēīōūǖ', 'áéíóúǘ', 'ǎěǐǒǔǚ', 'àèìòùǜ'][Number(item.recording.slice(-1)) - 1];
    assert.ok([...item.spoken].some(char => marks.includes(char)), item.id);
    assert.ok(toneName(item.recording));
  }
  assert.ok(INITIALS.every(item => item.note.includes('呼读音')));
});
test('authorized recordings are unchanged, decodable and individually attributed', async () => {
  const {sources} = JSON.parse(await readFile(new URL('../assets/sources.json', import.meta.url)));
  assert.equal(sources.filter(s => s.kind === 'pinyin').length, 143);
  for (const item of [...PINYIN_ITEMS, ...TONES]) {
    const source = sources.find(s => s.kind === 'pinyin' && s.id === item.id);
    if (!item.recording) {
      assert.equal(source, undefined);
      assert.equal(pinyinAudio(item.id), null);
      await assert.rejects(readFile(new URL(`../assets/pinyin/${item.id}.mp3`, import.meta.url)), {code: 'ENOENT'});
      continue;
    }
    assert.ok(pinyinAudio(item.id));
    assert.ok(source?.author);
    assert.equal(source.original.url, item.id === 'ong' ? 'https://chinahelp4u.com/wp-content/uploads/2021/10/finial-ong-.mp3' : `https://studycli.org/wp-content/uploads/mp3/${PINYIN_RECORDINGS[item.id]}.mp3`);
    assert.equal(source.original.sha256, source.assets[0].sha256);
    assert.equal(source.permission.status, 'user-confirmed');
    assert.equal(source.licenseUrl, undefined); // Project permission is not a CC license.
    const file = new URL(`../assets/pinyin/${item.id}.mp3`, import.meta.url).pathname;
    const bytes = await readFile(file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.original.sha256, item.id);
    const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], {encoding: 'utf8'}));
    assert.ok(duration > 0.1 && duration < 8, item.id);
  }
});

test('finals only use their own sound or a reviewed zero-initial spelling, never hong for ong', async () => {
  const spellings = {i: 'yi', u: 'wu', v: 'yu', ui: 'wei', iu: 'you', ie: 'ye', ve: 'yue', in: 'yin', un: 'wen', vn: 'yun', ing: 'ying'};
  for (const item of FINALS) {
    if (item.recording) assert.equal(item.recording.slice(0, -1), spellings[item.id] || item.symbol, item.id);
    else assert.equal(item.id, 'ong');
  }
  assert.equal(pinyinAudio('ong'), 'assets/pinyin/ong.mp3');
  assert.equal(PINYIN_RECORDINGS.ong, 'ong1');
  assert.ok(listeningItems('back').some(item => item.id === 'ong'));
  const files = (await readdir(new URL('../assets/pinyin/', import.meta.url))).filter(name => name.endsWith('.mp3'));
  assert.equal(files.length, 143);
  assert.ok(files.includes('ong.mp3'));
});

test('recognition examples use the first tone, including r/ri, while tone practice keeps all four', () => {
  for (const item of PINYIN_ITEMS.filter(item => item.recording)) {
    assert.equal(item.recording.at(-1), '1', item.id);
    assert.equal(toneName(item.recording), '第一声', item.id);
  }
  for (const id of ['initial-r', 'whole-ri']) {
    assert.equal(PINYIN_RECORDINGS[id], 'ri1');
    assert.equal(PINYIN_ITEMS.find(item => item.id === id).spoken, 'rī');
  }
  assert.deepEqual(toneExamples('ma').map(item => item.recording), ['ma1', 'ma2', 'ma3', 'ma4']);
});

test('multi-selected practice rotates categories while every question keeps distinct sounds in one category', () => {
  assert.deepEqual(PRACTICE_CATEGORIES.map(group => group.id), ['initials', 'finals', 'whole']);
  assert.equal(nextPracticeCategory([], 'finals'), null);
  assert.equal(nextPracticeCategory(['unknown'], ''), null);
  let previous = '';
  const order = Array.from({length: 5}, () => { previous = nextPracticeCategory(['finals', 'whole'], previous).id; return previous; });
  assert.deepEqual(order, ['finals', 'whole', 'finals', 'whole', 'finals']);
  assert.equal(nextPracticeCategory(['whole'], 'finals').id, 'whole');
  assert.deepEqual(practicePool('unknown'), []);
  for (const scope of ['initials', 'finals', 'whole']) {
    const pool = practicePool(scope);
    assert.equal(new Set(pool.map(item => item.recording)).size, pool.length);
    for (let i = 0; i < pool.length; i++) {
      const choices = quizChoices(pool, i, () => .3);
      assert.equal(choices.length, 3);
      assert.equal(choices.filter(item => item.id === pool[i].id).length, 1);
      assert.ok(choices.every(item => pool.includes(item)));
    }
  }
  assert.ok(practicePool('finals').some(item => item.id === 'ong'));
});
test('practice selections migrate old data, validate stored values and retain an intentional empty selection', () => {
  assert.deepEqual(normalizeState({}, books).pinyinScopes, ['finals']);
  assert.deepEqual(normalizeState({pinyinScopes: ['whole', 'unknown', 'whole', 'initials']}, books).pinyinScopes, ['initials', 'whole']);
  assert.deepEqual(normalizeState({pinyinScopes: []}, books).pinyinScopes, []);
});
test('each selectable tone base has exactly four correctly marked and playable recordings', () => {
  assert.deepEqual(TONE_BASES.map(base => base.id), ['a', 'o', 'e', 'yi', 'wu', 'yu', 'ai', 'ao', 'wei', 'you', 'yue', 'an', 'yun', 'ang', 'ying', 'dong', 'zi', 'zhi', 'er', 'ma']);
  assert.deepEqual(toneExamples('missing'), []);
  assert.equal(TONES.length, 80);
  for (const base of TONE_BASES) {
    const examples = toneExamples(base.id);
    assert.equal(examples.length, 4);
    examples.forEach((item, i) => {
      assert.equal(item.recording, `${base.id}${i + 1}`);
      assert.equal(item.symbol.normalize('NFD').replace(/[\u0300\u0301\u0304\u030c]/g, ''), base.id);
      assert.equal(item.name, toneName(item.recording));
      assert.ok(pinyinAudio(item.id));
    });
  }
});
