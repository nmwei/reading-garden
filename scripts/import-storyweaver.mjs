// Import only reviewed local source fixtures, never the whole platform.
import {mkdir, readdir, readFile, writeFile, rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readingLevelLabel} from '../web/app/reading-levels.js';
import {validateStoryWeaverFixture, storyWeaverPageRecords} from './storyweaver-metadata.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url)), root = repo + 'web/';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const books = JSON.parse(await readFile(root + 'data/books.json', 'utf8'));
const sources = JSON.parse(await readFile(root + 'assets/sources.json', 'utf8'));
const allNotes = JSON.parse(await readFile(root + 'data/book-notes.json', 'utf8'));
const fixtures = [];
for (const filename of (await readdir(root + 'data/storyweaver/')).filter(name => name.endsWith('.json')).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))) {
  const fixturePath = `data/storyweaver/${filename}`, fixtureBytes = await readFile(root + fixturePath), fixture = JSON.parse(fixtureBytes);
  const components = validateStoryWeaverFixture(fixture, filename, sources.sources.find(source => source.kind === 'book' && source.id === fixture.id));
  const notes = allNotes[fixture.id];
  if (!notes?.tag || !notes.color || !notes.intro || !notes.question || !notes.keywords?.length) throw Error(`Missing reviewed reading notes: ${fixture.id}`);
  fixtures.push({fixturePath, fixtureBytes, fixture, components, notes});
}
if (!fixtures.length) throw Error('No reviewed StoryWeaver fixtures found.');
const cache = repo + '.asset-cache/storyweaver/';
await mkdir(cache, {recursive: true});
const importedBooks = new Map(), importedSources = new Map();
for (const {fixturePath, fixtureBytes, fixture, components, notes} of fixtures) {
  await mkdir(root + `assets/books/${fixture.id}`, {recursive: true});
  const assets = [], imagePaths = new Map();
  for (const {sourcePage, image} of [{sourcePage: 1, image: fixture.cover}, ...fixture.pages.filter(page => !page.textOnly)]) {
    const path = `assets/books/${fixture.id}/${String(sourcePage).padStart(2, '0')}.jpg`;
    const cached = cache + image.sha256 + '.jpg';
    let bytes;
    try { bytes = await readFile(cached); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!bytes) {
      execFileSync('curl', ['-fsSL', '--connect-timeout', '10', '--max-time', '60', '--retry', '2', '-o', cached + '.part', image.url], {stdio: 'inherit'});
      bytes = await readFile(cached + '.part');
      if (digest(bytes) !== image.sha256) throw Error(`Illustration changed; review before importing: ${image.url}`);
      await rename(cached + '.part', cached);
    }
    if (digest(bytes) !== image.sha256) throw Error(`Invalid illustration: ${image.url}`);
    await writeFile(root + path, bytes);
    imagePaths.set(sourcePage, path);
    assets.push({path, url: image.url, illustrationSource: image.illustrationSource || `https://storyweaver.org.in/en/illustrations/${image.illustrationId}`,
      ...(image.copyright ? {copyright: image.copyright} : {}), ...(image.licenseUrl ? {licenseUrl: image.licenseUrl} : {}),
      ...(image.attributionText ? {attributionText: image.attributionText} : {}), bytes: bytes.length, sha256: image.sha256});
  }
  const {id, title, source, sourceLevel, license, licenseUrl, credits, copyright, changes} = fixture;
  const book = {id, title, ...notes, source, sourceLevel, license, licenseUrl, credits, copyright, changes, narration: 'none', cover: assets[0].path,
    pages: storyWeaverPageRecords(fixture.pages, imagePaths)};
  const record = {kind: 'book', id, source, sourceLevel, license, licenseUrl, credits, copyright, changes,
    components,
    reviewedAt: fixture.reviewedAt, attributionSource: fixture.attributionSource, metadataFile: fixturePath, metadataSha256: digest(fixtureBytes), assets};
  importedBooks.set(id, book); importedSources.set(id, record);
  console.log(`Imported ${title}: ${readingLevelLabel(sourceLevel)}, ${book.pages.length} pages, no story recordings.`);
}
// Write catalogs only after the entire batch passes; unrelated sources survive.
const previousIds = new Set(books.map(book => book.id));
await writeFile(root + 'data/books.json', JSON.stringify([...books.map(book => importedBooks.get(book.id) || book), ...[...importedBooks.values()].filter(book => !previousIds.has(book.id))], null, 2) + '\n');
sources.sources = [...sources.sources.filter(source => source.kind !== 'book' || !importedSources.has(source.id)), ...importedSources.values()];
await writeFile(root + 'assets/sources.json', JSON.stringify(sources, null, 2) + '\n');
