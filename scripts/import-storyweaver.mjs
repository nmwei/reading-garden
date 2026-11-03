// Import only the reviewed local source fixture, never the whole platform.
import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readingLevelLabel} from '../app/reading-levels.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixturePath = 'data/storyweaver/92448.json';
const fixtureBytes = await readFile(root + fixturePath);
const fixture = JSON.parse(fixtureBytes);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
if (fixture.id !== 'sw-92448' || !readingLevelLabel(fixture.sourceLevel) || fixture.pages.length !== 12 || fixture.license !== 'CC BY 4.0') throw Error('Review the StoryWeaver fixture before importing.');
const notes = JSON.parse(await readFile(root + 'data/book-notes.json', 'utf8'))[fixture.id];
if (!notes) throw Error('Missing reviewed reading notes.');
const cache = root + '.asset-cache/storyweaver/';
await mkdir(cache, {recursive: true});
await mkdir(root + `assets/books/${fixture.id}`, {recursive: true});
const assets = [];
for (const [index, image] of [fixture.cover, ...fixture.pages.map(page => page.image)].entries()) {
  const path = `assets/books/${fixture.id}/${String(index + 1).padStart(2, '0')}.jpg`;
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
  assets.push({path, url: image.url, illustrationSource: `https://storyweaver.org.in/en/illustrations/${image.illustrationId}`, bytes: bytes.length, sha256: image.sha256});
}
const {id, title, source, sourceLevel, license, licenseUrl, credits, copyright, changes} = fixture;
const book = {id, title, ...notes, source, sourceLevel, license, licenseUrl, credits, copyright, changes, narration: 'none', cover: assets[0].path,
  pages: fixture.pages.map((page, index) => ({text: page.text, image: assets[index + 1].path, imageFrame: page.imageFrame, sourcePage: page.sourcePage}))};
const record = {kind: 'book', id, source, sourceLevel, license, licenseUrl, credits, copyright, changes,
  components: {text: {source, licenseUrl, copyright: '© Jala, 2019'}, illustrations: {source, licenseUrl, copyright: '© Pratham Books, 2018'}},
  reviewedAt: fixture.reviewedAt, attributionSource: fixture.attributionSource, metadataFile: fixturePath, metadataSha256: digest(fixtureBytes), assets};
const books = JSON.parse(await readFile(root + 'data/books.json', 'utf8'));
const sources = JSON.parse(await readFile(root + 'assets/sources.json', 'utf8'));
await writeFile(root + 'data/books.json', JSON.stringify([...books.filter(item => item.id !== id), book], null, 2) + '\n');
sources.sources = [...sources.sources.filter(item => !(item.kind === 'book' && item.id === id)), record];
await writeFile(root + 'assets/sources.json', JSON.stringify(sources, null, 2) + '\n');
console.log(`Imported ${title}: ${readingLevelLabel(sourceLevel)}, ${book.pages.length} pages, no story recordings.`);
