import {mkdir, readdir, readFile, writeFile, cp, rm, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PINYIN_RECORDINGS} from '../app/pinyin.js';

const root = fileURLToPath(new URL('../', import.meta.url)), out = `${root}dist/`;
const books = JSON.parse(await readFile(`${root}data/books.json`, 'utf8'));
const sources = JSON.parse(await readFile(`${root}assets/sources.json`, 'utf8'));
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
  if (!page.text || !page.image || !page.audio) throw Error(`Incomplete story page: ${book.id}`);
  await Promise.all([stat(`${root}${page.image}`), stat(`${root}${page.audio}`)]);
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
let size = 0;
for (const path of files) { const bytes = await readFile(out + path); size += bytes.length; hash.update(path).update(bytes); }
const sw = await readFile(`${root}sw.js`, 'utf8');
hash.update(sw);
const version = hash.digest('hex').slice(0, 16);
await writeFile(`${out}sw.js`, sw.replace('__VERSION__', version));
await writeFile(`${out}precache.json`, JSON.stringify({version, bytes: size, files: [...files, 'precache.json']}, null, 2));
console.log(`Built ${books.length} books, ${files.length} files, ${(size / 1024 / 1024).toFixed(1)} MB · ${version}`);
