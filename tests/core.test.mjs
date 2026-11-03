import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {emptyState, normalizeState, routeFromHash, updateProgress, wordInContext, quizChoices} from '../app/core.js';
import {VOWELS, TONES, pinyinAudio, listeningVowels} from '../app/pinyin.js';

const books = JSON.parse(await readFile(new URL('../data/books.json', import.meta.url)));
test('invalid saved data cannot break reading or inject unknown content', () => {
  const state = normalizeState({progress: {'0087': {page: 900, finished: 'yes'}, unknown: {page: 0}}, words: [null, {char: '<script>', bookId: '0087', page: 0}, {char: '我', bookId: '0087', page: 0}, {char: '我', bookId: '0087', page: 1}], voice: {}, largeText: true}, books);
  assert.equal(state.progress['0087'].page, 7);
  assert.equal(state.progress['0087'].finished, false);
  assert.equal(state.progress.unknown, undefined);
  assert.deepEqual(state.words, [{char: '我', bookId: '0087', page: 0}]);
  assert.equal(state.voice, '');
  assert.deepEqual(normalizeState(null, books), emptyState());
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
test('listening choices always contain exactly one answer and distinct distractors', () => {
  for (let i = 0; i < VOWELS.length; i++) {
    const choices = quizChoices(VOWELS, i, () => 0.3);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map(c => c.id)).size, 3);
    assert.equal(choices.filter(c => c.id === VOWELS[i].id).length, 1);
  }
});
test('all story pages have intact, decodable local image/audio and per-book credits', async () => {
  assert.deepEqual(books.map(b => b.pages.length), [8, 5, 8]);
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
test('disabled speaker recordings cannot be played or enter listening questions', () => {
  for (const id of ['a', 'e', 'i', 'v', 'tone1', 'tone3', 'unknown']) assert.equal(pinyinAudio(id), null);
  assert.deepEqual(listeningVowels().map(v => v.id), ['o', 'u']);
});
test('enabled pinyin recordings are decodable and attributed; disabled files are absent', async () => {
  const {sources} = JSON.parse(await readFile(new URL('../assets/sources.json', import.meta.url)));
  for (const item of [...VOWELS, ...TONES]) {
    const source = sources.find(s => s.kind === 'pinyin' && s.id === item.id);
    if (!pinyinAudio(item.id)) {
      assert.equal(source, undefined);
      await assert.rejects(readFile(new URL(`../assets/pinyin/${item.id}.mp3`, import.meta.url)), {code: 'ENOENT'});
      continue;
    }
    assert.ok(source?.author);
    assert.ok(source?.licenseUrl);
    const file = new URL(`../assets/pinyin/${item.id}.mp3`, import.meta.url).pathname;
    const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], {encoding: 'utf8'}));
    assert.ok(duration > 0.1 && duration < 8, item.id);
  }
});
