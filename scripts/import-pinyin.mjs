import {mkdir, readFile, writeFile, readdir, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {PINYIN_RECORDINGS} from '../web/app/pinyin.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const uploads = 'https://studycli.org/wp-content/uploads/mp3/';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export async function importPinyin(root = projectRoot) {
  const permission = JSON.parse(await readFile(`${root}docs/pinyin-audio-permission.json`, 'utf8'));
  if (permission.status !== 'user-confirmed') throw Error('CLI audio permission has not been confirmed.');
  const ongPermission = JSON.parse(await readFile(`${root}docs/pinyin-ong-permission.json`, 'utf8'));
  if (ongPermission.status !== 'user-confirmed') throw Error('Independent ong audio permission has not been confirmed.');
  await mkdir(`${root}.asset-cache`, {recursive: true});
  const imported = [];
  // Fetch and decode every replacement before changing the published files.
  for (const [id, syllable] of Object.entries(PINYIN_RECORDINGS)) {
    if (!/^[a-z]+[1-4]$/.test(syllable)) throw Error(`Unexpected CLI syllable: ${syllable}`);
    const selectedPermission = id === 'ong' ? ongPermission : permission;
    const url = id === 'ong' ? ongPermission.audio : `${uploads}${syllable}.mp3`;
    const cached = `${root}.asset-cache/${id === 'ong' ? 'chinahelp-ong' : `cli-${syllable}`}.mp3`;
    let bytes;
    try { bytes = await readFile(cached); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      bytes = execFileSync('curl', ['-fsSL', '--retry', '3', '--max-time', '60', url], {maxBuffer: 2e6});
      await writeFile(cached, bytes);
    }
    const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', cached], {encoding: 'utf8'}));
    if (!(duration > 0.1 && duration < 8)) throw Error(`Invalid CLI audio: ${syllable}`);
    const asset = {path: `assets/pinyin/${id}.mp3`, bytes: bytes.length, sha256: sha256(bytes)};
    imported.push({bytes, source: {kind: 'pinyin', id, syllable, source: selectedPermission.source, author: selectedPermission.author,
      license: '经授权用于本项目（用户确认）', permission: selectedPermission,
      original: {url, bytes: bytes.length, sha256: asset.sha256},
      changes: '原始 MP3 原样保存，仅重命名；未剪辑或改变语速、音高。', assets: [asset]}});
  }
  await mkdir(`${root}web/assets/pinyin`, {recursive: true});
  for (const {bytes, source} of imported) await writeFile(`${root}web/${source.assets[0].path}`, bytes);
  for (const file of await readdir(`${root}web/assets/pinyin`)) {
    if (file.endsWith('.mp3') && !Object.hasOwn(PINYIN_RECORDINGS, file.slice(0, -4))) await rm(`${root}web/assets/pinyin/${file}`);
  }
  return imported.map(({source}) => source);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const manifestPath = `${projectRoot}web/assets/sources.json`;
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const pinyin = await importPinyin();
  manifest.sources = [...manifest.sources.filter(source => source.kind !== 'pinyin'), ...pinyin];
  manifest.importedAt = new Date().toISOString();
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Imported ${pinyin.length} authorized recordings unchanged; book assets preserved.`);
}
