import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateStoryWeaverFixture, storyWeaverPageRecords, validateImportedStoryWeaverBook} from '../scripts/storyweaver-metadata.mjs';

const drawing = JSON.parse(await readFile(new URL('../web/data/storyweaver/92448.json', import.meta.url)));
const {sources} = JSON.parse(await readFile(new URL('../web/assets/sources.json', import.meta.url)));
const prior = sources.find(source => source.kind === 'book' && source.id === drawing.id);
const fixture = () => ({...structuredClone(drawing), components: structuredClone(prior.components)});

test('reviewed fixture retains per-book component attribution instead of a hard-coded publisher', () => {
  assert.deepEqual(validateStoryWeaverFixture(drawing, '92448.json', prior), prior.components);
  const other = fixture();
  other.id = 'sw-123'; other.source = 'https://storyweaver.org.in/en/stories/123-example';
  other.components.text.copyright = '© A different translator, 2025';
  other.components.illustrations.copyright = '© A different illustrator, 2025';
  const components = validateStoryWeaverFixture(other, '123.json');
  assert.deepEqual(components, other.components);
  assert.throws(() => validateStoryWeaverFixture({...other, components: undefined}, '123.json', prior), /provenance/);
});

test('unreviewed licenses, identity mismatches and missing text/illustration provenance are rejected', () => {
  for (const edit of [
    book => { book.sourceLevel.system = 'Storybooks Canada'; },
    book => { book.sourceLevel.value = 5; },
    book => { book.source = 'https://storyweaver.org.in/en/stories/92449-other'; },
    book => { book.license = 'CC BY-NC 4.0'; },
    book => { delete book.credits['Translated by']; },
    book => { delete book.attributionSource; },
    book => { book.components.text.licenseUrl = 'https://example.org/'; },
    book => { delete book.components.illustrations.copyright; },
    book => { book.narration = 'recorded'; },
    book => { book.pages[0].audio = 'missing.mp3'; }
  ]) {
    const book = fixture(); edit(book);
    assert.throws(() => validateStoryWeaverFixture(book, '92448.json'), /Invalid StoryWeaver fixture/);
  }
  assert.throws(() => validateStoryWeaverFixture(fixture(), '../92448.json'), /filename/);
});

test('page omissions, changed asset pins and invalid artwork viewports fail before downloading', () => {
  for (const edit of [
    book => { book.pages.splice(1, 1); },
    book => { book.pages[1].sourcePage = 2; },
    book => { delete book.pages[0].originalText; },
    book => { book.cover.sha256 = 'unchecked'; },
    book => { book.pages[0].image.illustrationId = null; },
    book => { book.pages[0].imageFrame.x = -1; },
    book => { book.pages[0].imageFrame.height = 10000; },
    book => { book.pages[0].imageFrame.width = 0; }
  ]) {
    const book = fixture(); edit(book);
    assert.throws(() => validateStoryWeaverFixture(book, '92448.json'), /Invalid StoryWeaver fixture/);
  }
});

test('intentional wordless pages are preserved without accepting missing story text', () => {
  const book = fixture();
  Object.assign(book.pages[1], {originalText:'', text:'', wordless:true});
  assert.doesNotThrow(() => validateStoryWeaverFixture(book, '92448.json'));
  delete book.pages[1].wordless;
  assert.throws(() => validateStoryWeaverFixture(book, '92448.json'), /original\/reviewed text/);
  book.pages[1].wordless = true; delete book.pages[1].originalText;
  assert.throws(() => validateStoryWeaverFixture(book, '92448.json'), /original\/reviewed text/);
});

test('diagram labels require an artwork viewport and finite percentage coordinates', () => {
  const book = fixture();
  book.pages[0].imageLabels = [{text:'1',x:12.3,y:44.5}];
  assert.doesNotThrow(() => validateStoryWeaverFixture(book, '92448.json'));
  for (const label of [{text:'',x:12,y:44},{text:'1',x:Infinity,y:44},{text:'1',x:-1,y:44},{text:'1',x:12,y:101}]) {
    book.pages[0].imageLabels=[label];
    assert.throws(() => validateStoryWeaverFixture(book, '92448.json'), /imageLabels/);
  }
  book.pages[0].imageLabels=[{text:'1',x:12,y:44}];
  delete book.pages[0].imageFrame;
  assert.throws(() => validateStoryWeaverFixture(book, '92448.json'), /imageLabels/);
});

test('explicit text-only pages retain text and cannot shift subsequent illustration associations', () => {
  const book = fixture();
  Object.assign(book.pages[1], {textOnly: true});
  delete book.pages[1].image; delete book.pages[1].imageFrame;
  assert.doesNotThrow(() => validateStoryWeaverFixture(book, '92448.json'));
  const paths = new Map([[2,'02.jpg'],[4,'04.jpg']]);
  const pages = storyWeaverPageRecords(book.pages.slice(0,3), paths);
  assert.equal(pages[0].image,'02.jpg');
  assert.equal(pages[1].textOnly,true); assert.equal(pages[1].text,book.pages[1].text);
  assert.ok(!('image' in pages[1])); assert.ok(!('imageFrame' in pages[1]));
  assert.equal(pages[2].image,'04.jpg');
  delete book.pages[1].textOnly;
  assert.throws(() => validateStoryWeaverFixture(book, '92448.json'), /image source/);
  book.pages[1].textOnly=true; book.pages[1].image=book.cover;
  assert.throws(() => validateStoryWeaverFixture(book, '92448.json'), /textOnly/);
});

test('catalog text, page order and illustrations must match the reviewed fixture even when its hash is unchanged', () => {
  const source = fixture();
  const imagePaths = new Map(source.pages.map(page => [page.sourcePage, `assets/books/${source.id}/${String(page.sourcePage).padStart(2,'0')}.jpg`]));
  const book = {...source, narration:'none', cover:`assets/books/${source.id}/01.jpg`, pages:JSON.parse(JSON.stringify(storyWeaverPageRecords(source.pages,imagePaths)))};
  assert.doesNotThrow(() => validateImportedStoryWeaverBook(book,source));
  for (const edit of [
    book => {book.pages[0].text='绕过审核的新文字';},
    book => {book.pages.splice(1,1);},
    book => {[book.pages[0].image,book.pages[1].image]=[book.pages[1].image,book.pages[0].image];},
    book => {book.pages[0].sourcePage=99;},
    book => {book.pages[0].imageFrame.x++;},
    book => {book.sourceLevel.value=3;},
    book => {book.narration='recorded';}
  ]) {
    const changed=structuredClone(book);edit(changed);
    assert.throws(() => validateImportedStoryWeaverBook(changed,source), /differs from reviewed fixture/);
  }
});

test('every published StoryWeaver catalog entry agrees with its full reviewed metadata', async () => {
  const books=JSON.parse(await readFile(new URL('../web/data/books.json',import.meta.url)));
  for (const book of books.filter(book=>book.sourceLevel.system==='StoryWeaver')) {
    const source=JSON.parse(await readFile(new URL(`../web/data/storyweaver/${book.id.slice(3)}.json`,import.meta.url)));
    assert.doesNotThrow(() => validateImportedStoryWeaverBook(book,source),book.id);
  }
});
