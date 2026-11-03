import {mkdir, readFile, writeFile, access, readdir, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PINYIN_RECORDINGS} from '../app/pinyin.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://www.storybookscanada.ca';
const get = url => execFileSync('curl', ['-fsSL', '--retry', '3', '--max-time', '60', url], {maxBuffer: 15e6});
const strip = text => text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const presets = [
  {id: '0087', title: '我喜欢看书', tag: '家人与我', color: 'peach', intro: '捧起一本书，可以念给谁听呢？', keywords: ['书', '看', '我'], question: '你想把这个故事念给谁听？'},
  {id: '0156', title: '很饿的鳄鱼', tag: '动物朋友', color: 'sage', intro: '悄悄游来的鳄鱼，肚子又饿啦。', keywords: ['饿', '吃', '鱼'], question: '鳄鱼肚子饿的时候，会做什么呢？'},
  {id: '0009', title: '我的小猫猫在哪儿？', tag: '找一找', color: 'lavender', intro: '床底下、沙发后，小猫躲在哪里？', keywords: ['猫', '上', '下'], question: '你能用“里面”或者“后面”说一句话吗？'}
];

const sources = [];
async function download(url, path, expectedSha1) {
  const absolute = `${root}${path}`;
  await mkdir(absolute.slice(0, absolute.lastIndexOf('/')), {recursive: true});
  let bytes;
  if (await access(absolute).then(() => true, () => false)) bytes = await readFile(absolute);
  else { bytes = get(url); await writeFile(absolute, bytes); }
  if (expectedSha1 && createHash('sha1').update(bytes).digest('hex') !== expectedSha1) throw Error(`Source hash mismatch: ${path}`);
  return {path, url, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length};
}

const books = [];
for (const preset of presets) {
  const source = `${origin}/stories/zh/${preset.id}/`;
  const html = get(source).toString();
  const texts = [...html.matchAll(/<div class="[^"]*level1-txt def"><h3>([\s\S]*?)<\/h3>/g)].map(m => strip(m[1]));
  const imagePaths = [...html.matchAll(new RegExp(`src="(/images/${preset.id}/[^"]+)"`, 'g'))].map(m => m[1]);
  const audioPaths = [...html.matchAll(new RegExp(`src="(/audio/zh/${preset.id}/mp3/[^\"]+)"`, 'g'))].map(m => m[1]);
  if (!texts.length || imagePaths.length !== texts.length + 1 || audioPaths.length !== imagePaths.length) throw Error(`Unexpected page structure: ${preset.id}`);
  const licenseUrl = html.match(/rel="license" href="([^"]+)"/)?.[1];
  if (!licenseUrl?.match(/^https:\/\/creativecommons.org\/licenses\/by(?:-nc)?\/3\.0\/$/)) throw Error(`Unreviewed license: ${preset.id}`);
  const credits = Object.fromEntries([...html.matchAll(/<h5><span class="colophon-heading">([^<]+):<\/span>\s*([^<]+)<\/h5>/g)].map(m => [m[1], strip(m[2])]));
  const assets = [];
  const pages = [];
  for (let i = 0; i < imagePaths.length; i++) {
    const name = String(i + 1).padStart(2, '0');
    assets.push(await download(origin + imagePaths[i], `assets/books/${preset.id}/${name}.jpg`));
    if (i > 0) {
      assets.push(await download(origin + audioPaths[i], `assets/books/${preset.id}/${name}.mp3`));
      pages.push({text: texts[i - 1], image: `assets/books/${preset.id}/${name}.jpg`, audio: `assets/books/${preset.id}/${name}.mp3`});
    }
  }
  const license = licenseUrl.includes('by-nc') ? 'CC BY-NC 3.0' : 'CC BY 3.0';
  books.push({...preset, source, license, licenseUrl, credits, cover: `assets/books/${preset.id}/01.jpg`, pages});
  sources.push({kind: 'book', id: preset.id, source, credits, license, licenseUrl, changes: '文字、图片与录音保持原样；另行编写中文简介、阅读提示和词语解释。', assets});
  console.log(`Imported ${preset.title}: ${pages.length} pages`);
}

// These are Mandarin example-word recordings, not English letter names.
const recordings = Object.entries(PINYIN_RECORDINGS);
await mkdir(`${root}assets/pinyin`, {recursive: true});
for (const file of await readdir(`${root}assets/pinyin`)) {
  if (file.endsWith('.mp3') && !Object.hasOwn(PINYIN_RECORDINGS, file.slice(0, -4))) await rm(`${root}assets/pinyin/${file}`);
}
const query = new URLSearchParams({action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|sha1|extmetadata', titles: recordings.map(r => r[1]).join('|')});
const metadata = JSON.parse(get(`https://commons.wikimedia.org/w/api.php?${query}`).toString());
for (const [id, title] of recordings) {
  const page = Object.values(metadata.query.pages).find(p => p.title === title);
  const info = page?.imageinfo?.[0];
  if (!info) throw Error(`Missing Commons source: ${title}`);
  const meta = info.extmetadata;
  const license = meta.LicenseShortName?.value;
  if (!['CC BY 2.0 fr', 'CC BY-SA 3.0 us', 'CC BY-SA 4.0'].includes(license)) throw Error(`Unreviewed audio license: ${title}`);
  const original = await download(info.url, `.asset-cache/${id}.${title.endsWith('.wav') ? 'wav' : 'ogg'}`, info.sha1);
  const output = `assets/pinyin/${id}.mp3`;
  await mkdir(`${root}assets/pinyin`, {recursive: true});
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `${root}${original.path}`, '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-q:a', '3', `${root}${output}`]);
  const bytes = await readFile(`${root}${output}`);
  sources.push({kind: 'pinyin', id, source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`, original: {...original, sha1: info.sha1}, author: strip(meta.Artist?.value || ''), description: strip(meta.ImageDescription?.value || ''), license, licenseUrl: meta.LicenseUrl?.value, changes: '仅转换为单声道 MP3，未剪辑或改变语速、音高。转换版本沿用原许可。', assets: [{path: output, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')}]});
  console.log(`Imported pinyin example ${id}: ${license}`);
}
await mkdir(`${root}data`, {recursive: true});
await writeFile(`${root}data/books.json`, JSON.stringify(books, null, 2) + '\n');
await writeFile(`${root}assets/sources.json`, JSON.stringify({importedAt: new Date().toISOString(), sources}, null, 2) + '\n');
