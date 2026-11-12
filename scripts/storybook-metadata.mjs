import {readingLevelLabel} from '../web/app/reading-levels.js';

const strip = text => text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

export function readCatalog(html) {
  const entries = [...html.matchAll(/href="\/stories\/zh\/(\d{4})\/">\s*<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?href="\/stories\/zh\/level([1-5])"/g)]
    .map(([, id, title, level]) => ({id, title: strip(title), level: Number(level)}));
  if (!entries.length || new Set(entries.map(entry => entry.id)).size !== entries.length) throw Error('Invalid Chinese story catalog.');
  return entries;
}

export function readRepositoryLicense(readme, id) {
  const row = readme.split('\n').find(line => new RegExp(`^\\|?\\s*\\[?${id}\\]?(?:\\([^)]*\\))?\\s*\\|`).test(line));
  const url = row?.match(/https:\/\/creativecommons.org\/licenses\/by(?:-nc)?\/[34]\.0\//)?.[0];
  if (!url) throw Error(`Missing component license: ${id}`);
  return url;
}

export function readStory(html, id) {
  const title = strip(html.match(/<h1>\s*<span class="def">([\s\S]*?)<\/span>/)?.[1] || '');
  const sourceLevel = readSourceLevel(html);
  const texts = [...html.matchAll(/<div class="[^"]*level[1-5]-txt def"><h3>([\s\S]*?)<\/h3>/g)].map(match => strip(match[1]));
  const images = [...html.matchAll(new RegExp(`src="(/images/${id}/[^\"]+)"`, 'g'))].map(match => match[1]);
  const audio = [...html.matchAll(new RegExp(`src="(/audio/zh/${id}/mp3/[^\"]+)"`, 'g'))].map(match => match[1]);
  if (!title || !texts.length || images.length !== texts.length + 1 || audio.length !== images.length) throw Error(`Unexpected story structure: ${id}`);
  for (let i = 0; i < images.length; i++) {
    const number = String(i + 1).padStart(2, '0');
    if (images[i] !== `/images/${id}/${number}.jpg` || audio[i] !== `/audio/zh/${id}/mp3/${number}.mp3`) throw Error(`Media order changed: ${id}`);
  }
  const licenseUrl = html.match(/rel="license" href="([^"]+)"/)?.[1];
  if (!/^https:\/\/creativecommons.org\/licenses\/by(?:-nc)?\/[34]\.0\/$/.test(licenseUrl || '')) throw Error(`Unreviewed license: ${id}`);
  const credits = Object.fromEntries([...html.matchAll(/<h5><span class="colophon-heading">([^<]+):<\/span>\s*([^<]+)<\/h5>/g)].map(([, role, name]) => [role, strip(name)]));
  for (const role of ['Written by', 'Illustrated by', 'Translated by', 'Read by']) if (!credits[role]) throw Error(`Missing ${role}: ${id}`);
  return {title, sourceLevel, texts, images, audio, licenseUrl, license: `CC BY${licenseUrl.includes('by-nc') ? '-NC' : ''} ${licenseUrl.includes('/4.0/') ? '4.0' : '3.0'}`, credits};
}

export function readSourceLevel(html) {
  // Read explicit colophon metadata; the page's "level1-txt" CSS class is not a grade.
  const row = html.match(/<h5>\s*<span\b[^>]*>\s*Level:\s*<\/span>([\s\S]*?)<\/h5>/i)?.[1];
  const link = row?.match(/<a\b[^>]*href="\/stories\/zh\/level(\d+)\/?"[^>]*>\s*Level\s+(\d+)\s*<\/a>/i);
  const sourceLevel = {system: 'Storybooks Canada', value: Number(link?.[1])};
  if (!link || link[1] !== link[2] || !readingLevelLabel(sourceLevel)) {
    throw Error('Missing or unrecognized Storybooks Canada source level; review the story metadata.');
  }
  return sourceLevel;
}
