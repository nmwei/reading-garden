import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readSourceLevel, readStory, readCatalog, readRepositoryLicense} from '../scripts/storybook-metadata.mjs';
import {readingLevelLabel} from '../app/reading-levels.js';

const metadata = level => `<div class="level1-txt def"><h3>故事</h3></div><h5><span class="colophon-heading">Level:</span> <a href="/stories/zh/level${level}">Level ${level}</a></h5>`;

test('import reads explicit source grading, independent of text CSS and book length', () => {
  for (let value = 1; value <= 5; value++) {
    assert.deepEqual(readSourceLevel(metadata(value)), {system: 'Storybooks Canada', value});
    assert.match(readingLevelLabel(readSourceLevel(metadata(value))), new RegExp(`^${value}级 · `));
  }
  assert.throws(() => readSourceLevel('<div class="level1-txt def">没有来源级别</div>'), /source level/);
  assert.throws(() => readSourceLevel(metadata(6)), /source level/);
  assert.throws(() => readSourceLevel(metadata(2).replace('Level 2<', 'Level 1<')), /source level/);
  for (const value of [undefined, {system: 'Other', value: 1}, {system: 'Storybooks Canada', value: '1'}, {system: 'Storybooks Canada', value: 0}]) assert.equal(readingLevelLabel(value), null);
});

test('current books retain source grading alongside their provenance', async () => {
  const books = JSON.parse(await readFile(new URL('../data/books.json', import.meta.url)));
  const {sources} = JSON.parse(await readFile(new URL('../assets/sources.json', import.meta.url)));
  assert.deepEqual([1,2,3,4,5].map(level => books.filter(book => book.sourceLevel.value === level).length), [15,11,8,4,2]);
  assert.deepEqual(Object.fromEntries(['CC BY 3.0','CC BY 4.0','CC BY-NC 3.0'].map(license => [license, books.filter(book => book.license === license).length])), {'CC BY 3.0':20,'CC BY 4.0':9,'CC BY-NC 3.0':11});
  for (const book of books) {
    assert.equal(book.sourceLevel.system, 'Storybooks Canada');
    assert.match(readingLevelLabel(book.sourceLevel), new RegExp(`^${book.sourceLevel.value}级 · `));
    const source = sources.find(source => source.kind === 'book' && source.id === book.id);
    assert.deepEqual(source.sourceLevel, book.sourceLevel);
    for (const component of ['text','illustrations','audio']) { assert.equal(source.components[component].licenseUrl, book.licenseUrl); assert.ok(source.components[component].source.startsWith('https://')); }
    assert.equal(source.assets.length, 1 + book.pages.length * 2);
  }
});

// A minimal source fixture exercises higher-level CSS and independent licenses.
test('story import accepts higher levels and preserves distinct translation/reader credits', () => {
  const html = `<h1><span class="def">小故事</span></h1>${metadata(5)}<img src="/images/0001/01.jpg"><img src="/images/0001/02.jpg"><audio src="/audio/zh/0001/mp3/01.mp3"></audio><audio src="/audio/zh/0001/mp3/02.mp3"></audio><div class="level5-txt def"><h3>长一点的故事。</h3></div><a rel="license" href="https://creativecommons.org/licenses/by/4.0/">许可</a>${['Written by','Illustrated by','Translated by','Read by'].map((role,i) => `<h5><span class="colophon-heading">${role}:</span> Person ${i}</h5>`).join('')}`.replace('<div class="level1-txt def"><h3>故事</h3></div>', '');
  const story = readStory(html, '0001');
  assert.equal(story.sourceLevel.value, 5); assert.equal(story.license, 'CC BY 4.0');
  assert.deepEqual(story.texts, ['长一点的故事。']);
  assert.equal(story.credits['Translated by'], 'Person 2');
  assert.throws(() => readStory(html.replace('/02.mp3','/03.mp3'), '0001'), /order changed/);
  assert.equal(readRepositoryLicense('[0001](https://example.org) | test | [BY](https://creativecommons.org/licenses/by/4.0/)', '0001'), story.licenseUrl);
  assert.throws(() => readRepositoryLicense('0002 | not found', '0001'), /Missing/);
  assert.deepEqual(readCatalog('<a href="/stories/zh/0001/"><h3>小故事</h3></a><a href="/stories/zh/level5">Level 5</a>'), [{id:'0001',title:'小故事',level:5}]);
});
