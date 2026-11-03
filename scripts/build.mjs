import {mkdir, readdir, readFile, writeFile, cp, rm, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PINYIN_RECORDINGS} from '../app/pinyin.js';
import {readingLevelLabel, readingLevelKey} from '../app/reading-levels.js';

const root = fileURLToPath(new URL('../', import.meta.url)), out = `${root}dist/`;
const books = JSON.parse(await readFile(`${root}data/books.json`, 'utf8'));
const sources = JSON.parse(await readFile(`${root}assets/sources.json`, 'utf8'));
for (const book of books) {
  const source = sources.sources.find(source => source.kind === 'book' && source.id === book.id);
  if (source?.metadataFile && createHash('sha256').update(await readFile(root + source.metadataFile)).digest('hex') !== source.metadataSha256) throw Error(`Reviewed text changed; reimport ${book.id}`);
  if (!readingLevelLabel(book.sourceLevel) || source?.sourceLevel?.system !== book.sourceLevel.system || source?.sourceLevel?.value !== book.sourceLevel.value) {
    throw Error(`Missing or inconsistent source reading level: ${book.id}`);
  }
}
const allowedPinyin = Object.keys(PINYIN_RECORDINGS).map(id => `${id}.mp3`).sort();
const actualPinyin = (await readdir(`${root}assets/pinyin`)).filter(name => name.endsWith('.mp3')).sort();
if (JSON.stringify(allowedPinyin) !== JSON.stringify(actualPinyin)) throw Error('Pinyin audio files must match enabled recordings; remove rejected files or import approved replacements.');
const pinyinSources = sources.sources.filter(source => source.kind === 'pinyin');
if (pinyinSources.length !== allowedPinyin.length) throw Error('Pinyin attribution must match enabled recordings.');
for (const [id, syllable] of Object.entries(PINYIN_RECORDINGS)) {
  const matching = pinyinSources.filter(source => source.id === id);
  if (matching.length !== 1 || matching[0].syllable !== syllable || matching[0].assets.length !== 1 || matching[0].assets[0].path !== `assets/pinyin/${id}.mp3`) {
    throw Error(`Pinyin source changed; import the selected recording before building: ${id}`);
  }
}
// Fail the build instead of releasing missing or silently changed licensed assets.
for (const source of sources.sources) for (const asset of source.assets) {
  const bytes = await readFile(`${root}${asset.path}`);
  if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw Error(`Asset integrity mismatch: ${asset.path}`);
}
for (const book of books) for (const page of book.pages) {
  // An explicit capability distinguishes an intentionally silent book from a
  // damaged import that lost a required recording.
  if (!page.text || !page.image || (book.narration === 'none' ? page.audio != null : !page.audio)) throw Error(`Incomplete story page: ${book.id}`);
  await Promise.all([page.image, page.audio].filter(Boolean).map(path => stat(`${root}${path}`)));
}
await rm(out, {recursive: true, force: true});
await mkdir(out, {recursive: true});
for (const path of ['index.html', 'manifest.webmanifest', 'app', 'assets', 'data']) await cp(`${root}${path}`, `${out}${path}`, {recursive: true});
async function walk(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    if (entry.isDirectory()) files.push(...await walk(`${dir}/${entry.name}`, `${prefix}${entry.name}/`));
    else files.push(prefix + entry.name);
  }
  return files;
}
const files = (await walk(out)).sort(), hash = createHash('sha256');
const assets = Object.fromEntries(sources.sources.flatMap(source => source.assets).map(asset => [asset.path, asset.sha256]));
const assetBytes = new Map(sources.sources.flatMap(source => source.assets).map(asset => [asset.path, asset.bytes]));
const group = paths => ({files: [...new Set(paths)], bytes: [...new Set(paths)].reduce((sum, path) => sum + assetBytes.get(path), 0)});
const bookGroups = Object.fromEntries(books.map(book => [book.id, {title: book.title, level: book.sourceLevel.value, levelKey: readingLevelKey(book.sourceLevel), levelLabel: readingLevelLabel(book.sourceLevel), cover: book.cover, ...group([book.cover, ...book.pages.flatMap(page => [page.image, page.audio].filter(Boolean))])}]));
const pinyin = group(allowedPinyin.map(file => `assets/pinyin/${file}`));
hash.update(JSON.stringify({assets, bookGroups, pinyin}));
let size = 0;
for (const path of files) { const bytes = await readFile(out + path); size += bytes.length; hash.update(path).update(bytes); }
const sw = await readFile(`${root}sw.js`, 'utf8');
hash.update(sw);
const version = hash.digest('hex').slice(0, 16);
await writeFile(`${out}sw.js`, sw.replace('__VERSION__', version));
await writeFile(`${out}precache.json`, JSON.stringify({version, bytes: size, files: [...files, 'precache.json'], assets, books: bookGroups, pinyin}, null, 2));
console.log(`Built ${books.length} books, ${files.length} files, ${(size / 1024 / 1024).toFixed(1)} MB · ${version}`);
