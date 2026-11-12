import {mkdir, readFile, writeFile, rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {readStory, readCatalog, readRepositoryLicense} from './storybook-metadata.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url)), root = `${repo}web/`, cache = `${repo}.asset-cache/storybooks/`;
const origin = 'https://www.storybookscanada.ca';
const imageRef = '0df409752c86adc92685816e19e6085c4e4496f1';
const archives = {
  images: {url: `https://codeload.github.com/global-asp/gsn-imagebank/zip/${imageRef}`, sha256: '7e7d68a3d66a1c64ac26915275a82a26c29325aa8b9f2fe0d71270d293fd7ac6'},
  audio: {url: 'https://github.com/global-asp/gsn-audio/releases/download/1.0/zh-audio-gsn.zip', sha256: 'c23579af0dd1c985888a007f930977b73972b937cc1d1cae164b29918bacf859'}
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fresh = process.argv.includes('--refresh');
await mkdir(cache, {recursive: true});
async function cached(name, url, expected, refresh = false) {
  let bytes;
  try { if (!refresh) bytes = await readFile(cache + name); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!bytes) {
    execFileSync('curl', ['-fsSL', '--connect-timeout', '10', '--max-time', '180', '--retry', '2', '-o', cache + name + '.part', url], {stdio: 'inherit'});
    bytes = await readFile(cache + name + '.part');
    if (expected && digest(bytes) !== expected) throw Error(`Archive changed; review before importing: ${url}`);
    await rename(cache + name + '.part', cache + name);
  }
  if (expected && digest(bytes) !== expected) throw Error(`Invalid cached archive: ${name}`);
  return bytes;
}
const notes = JSON.parse(await readFile(`${root}data/book-notes.json`, 'utf8'));
const catalog = readCatalog((await cached('catalog.html', `${origin}/stories/zh/`, null, fresh)).toString());
const imageZip = cache + 'images.zip', audioZip = cache + 'audio.zip';
await cached('images.zip', archives.images.url, archives.images.sha256);
await cached('audio.zip', archives.audio.url, archives.audio.sha256);
const imagePrefix = execFileSync('unzip', ['-Z1', imageZip], {encoding: 'utf8'}).split('\n').find(path => path.endsWith('/README.md')).replace('README.md', '');
const imageReadme = execFileSync('unzip', ['-p', imageZip, imagePrefix + 'README.md'], {encoding: 'utf8'});
const audioReadmeUrl = 'https://raw.githubusercontent.com/global-asp/gsn-audio/master/README.md';
const audioReadme = (await cached('audio-README.md', audioReadmeUrl, null, fresh)).toString();
const previous = JSON.parse(await readFile(`${root}assets/sources.json`, 'utf8'));
const previousBooks = JSON.parse(await readFile(`${root}data/books.json`, 'utf8'));
const books = [], sources = [];
for (const entry of catalog) {
  const {id} = entry, source = `${origin}/stories/zh/${id}/`;
  if (!notes[id]) throw Error(`Add reviewed reading notes before importing new book: ${id}`);
  const html = (await cached(`${id}.html`, source, null, fresh)).toString();
  const story = readStory(html, id);
  if (story.sourceLevel.value !== entry.level || story.title !== entry.title) throw Error(`Catalog changed: ${id}`);
  const imageLicense = readRepositoryLicense(imageReadme, id), audioLicense = readRepositoryLicense(audioReadme, id);
  // Check all three sources independently, retaining their individual records.
  if (imageLicense !== story.licenseUrl || audioLicense !== story.licenseUrl) throw Error(`Component licenses differ; review ${id} before importing.`);
  const assets = [], pages = [];
  await mkdir(`${root}assets/books/${id}`, {recursive: true});
  for (let i = 0; i < story.images.length; i++) {
    const number = String(i + 1).padStart(2, '0');
    for (const type of i ? ['image', 'audio'] : ['image']) {
      const image = type === 'image', path = `assets/books/${id}/${number}.${image ? 'jpg' : 'mp3'}`;
      const member = image ? `${imagePrefix}${id}/${number}.jpg` : `zh/${id}/mp3/${number}.mp3`;
      const bytes = execFileSync('unzip', ['-p', image ? imageZip : audioZip, member], {maxBuffer: 10e6});
      if (bytes.length < 100) throw Error(`Empty media: ${member}`);
      await writeFile(root + path, bytes);
      assets.push({path, url: origin + (image ? story.images[i] : story.audio[i]), bytes: bytes.length, sha256: digest(bytes)});
    }
    if (i) pages.push({text: story.texts[i - 1], image: `assets/books/${id}/${number}.jpg`, audio: `assets/books/${id}/${number}.mp3`});
  }
  const {title, sourceLevel, license, licenseUrl, credits} = story;
  books.push({id, title, ...notes[id], source, sourceLevel, license, licenseUrl, credits, cover: `assets/books/${id}/01.jpg`, pages});
  sources.push({kind: 'book', id, source, sourceLevel, credits, license, licenseUrl,
    components: {text: {source, licenseUrl}, illustrations: {source: `https://github.com/global-asp/gsn-imagebank/tree/${imageRef}/${id}`, licenseUrl: imageLicense}, audio: {source: 'https://github.com/global-asp/gsn-audio/releases/tag/1.0', licenseUrl: audioLicense}},
    metadataSha256: digest(Buffer.from(html)), archives,
    changes: '文字、图片与录音保持原样；另行编写中文简介、阅读提示和词语解释。', assets});
  console.log(`Imported ${title}: level ${sourceLevel.value}, ${pages.length} pages`);
}
// Pinyin has its own importer and permissions; a book import must not rewrite it.
const importedIds = new Set(books.map(book => book.id));
await writeFile(`${root}data/books.json`, JSON.stringify([...books, ...previousBooks.filter(book => book.sourceLevel.system !== 'Storybooks Canada')], null, 2) + '\n');
await writeFile(`${root}assets/sources.json`, JSON.stringify({importedAt: new Date().toISOString(), sources: [...sources, ...previous.sources.filter(source => source.kind !== 'book' || (!importedIds.has(source.id) && source.sourceLevel?.system !== 'Storybooks Canada'))]}, null, 2) + '\n');
