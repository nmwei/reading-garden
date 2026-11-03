import {readingLevelLabel} from '../app/reading-levels.js';
import {isDeepStrictEqual} from 'node:util';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const https = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
};

// Fixtures are an editorial approval boundary, not an automatic platform crawl.
export function validateStoryWeaverFixture(fixture, filename, previousSource) {
  const fail = message => { throw Error(`Invalid StoryWeaver fixture ${filename}: ${message}`); };
  const sourceId = filename.replace(/\.json$/, '');
  if (!/^\d+$/.test(sourceId) || fixture.id !== `sw-${sourceId}`) fail('id must match its numeric filename');
  if (!https(fixture.source) || !new RegExp(`^https://storyweaver\\.org\\.in/en/stories/${sourceId}(?:-|$|[?#/])`).test(fixture.source)) fail('source must identify the reviewed story');
  if (fixture.sourceLevel?.system !== 'StoryWeaver' || !readingLevelLabel(fixture.sourceLevel)) fail('source reading level');
  if (fixture.license !== 'CC BY 4.0' || fixture.licenseUrl !== 'https://creativecommons.org/licenses/by/4.0/') fail('review text and illustration licenses');
  for (const field of ['title', 'copyright', 'changes', 'attributionSource']) if (!nonempty(fixture[field])) fail(`missing ${field}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fixture.reviewedAt || '') || !Number.isFinite(Date.parse(fixture.reviewedAt))) fail('reviewedAt');
  for (const role of ['Written by', 'Illustrated by', 'Translated by']) if (!nonempty(fixture.credits?.[role])) fail(`missing ${role}`);
  if ((fixture.narration != null && fixture.narration !== 'none') || fixture.credits['Read by']) fail('this importer only supports explicitly unrecorded stories');
  // Earlier fixtures may retain already-reviewed provenance in sources.json.
  // Never substitute another book's author, publisher or copyright holder.
  const components = fixture.components || (previousSource?.id === fixture.id ? previousSource.components : null);
  for (const kind of ['text', 'illustrations']) {
    const component = components?.[kind];
    if (!https(component?.source) || component.licenseUrl !== fixture.licenseUrl || !nonempty(component.copyright)) fail(`missing reviewed ${kind} provenance`);
  }
  if (components.audio) fail('unexpected audio provenance');
  if (!Array.isArray(fixture.pages) || !fixture.pages.length) fail('missing story pages');
  const validateImage = (image, label) => {
    if (!https(image?.url) || !/^[a-f0-9]{64}$/.test(image.sha256 || '') || !Number.isSafeInteger(image.illustrationId) || image.illustrationId <= 0) fail(`${label} image source/hash/illustration id`);
  };
  validateImage(fixture.cover, 'cover');
  for (const [index, page] of fixture.pages.entries()) {
    if (!Number.isSafeInteger(page.sourcePage) || page.sourcePage < 2 || (index && page.sourcePage !== fixture.pages[index - 1].sourcePage + 1)) fail(`page ${index + 1} source page continuity`);
    const wordless = page.wordless === true && page.originalText === '' && page.text === '';
    if (!wordless && (!nonempty(page.originalText) || !nonempty(page.text) || !/\p{Script=Han}/u.test(page.text))) fail(`page ${index + 1} original/reviewed text`);
    if (page.wordless != null && !wordless) fail(`page ${index + 1} inconsistent wordless marker`);
    if (page.audio != null) fail(`page ${index + 1} unexpected audio`);
    if (page.textOnly != null) {
      if (page.textOnly !== true || wordless || !nonempty(page.originalText) || !nonempty(page.text) || page.image != null || page.imageFrame != null || page.imageLabels != null) fail(`page ${index + 1} inconsistent textOnly marker`);
      continue;
    }
    validateImage(page.image, `page ${index + 1}`);
    if (page.imageFrame) {
      const frame = page.imageFrame;
      if (!['x', 'y', 'width', 'height', 'originalWidth', 'originalHeight'].every(key => Number.isSafeInteger(frame[key])) || frame.x < 0 || frame.y < 0 || frame.width <= 0 || frame.height <= 0 || frame.x + frame.width > frame.originalWidth || frame.y + frame.height > frame.originalHeight) fail(`page ${index + 1} imageFrame bounds`);
    }
    if (page.imageLabels != null && (!page.imageFrame || !Array.isArray(page.imageLabels) || !page.imageLabels.length || page.imageLabels.some(label => !nonempty(label?.text) || !Number.isFinite(label.x) || !Number.isFinite(label.y) || label.x < 0 || label.x > 100 || label.y < 0 || label.y > 100))) fail(`page ${index + 1} imageLabels coordinates`);
  }
  return components;
}

// Source page numbers, rather than dense asset indexes, survive text-only pages.
export function storyWeaverPageRecords(pages, imagePaths) {
  return pages.map(page => {
    const image = imagePaths.get(page.sourcePage);
    if (!page.textOnly && !image) throw Error(`Missing imported illustration: source page ${page.sourcePage}`);
    return {text: page.text, ...(page.textOnly ? {textOnly: true} : {image, imageFrame: page.imageFrame}),
      ...(page.wordless ? {wordless: true} : {}), ...(page.imageAlt ? {imageAlt: page.imageAlt} : {}),
      ...(page.imageLabels ? {imageLabels: page.imageLabels} : {}), sourcePage: page.sourcePage};
  });
}

// The reviewed fixture is authoritative; hashing it alone does not establish
// that the separately generated catalog still contains the reviewed content.
export function validateImportedStoryWeaverBook(book, fixture) {
  const fail = field => { throw Error(`Imported StoryWeaver book differs from reviewed fixture: ${fixture.id} ${field}; reimport before building`); };
  for (const field of ['id', 'title', 'source', 'sourceLevel', 'license', 'licenseUrl', 'credits', 'copyright', 'changes']) {
    if (!isDeepStrictEqual(book[field], fixture[field])) fail(field);
  }
  if (book.narration !== 'none') fail('narration');
  const assetPath = sourcePage => `assets/books/${fixture.id}/${String(sourcePage).padStart(2, '0')}.jpg`;
  if (book.cover !== assetPath(1)) fail('cover');
  const imagePaths = new Map(fixture.pages.filter(page => !page.textOnly).map(page => [page.sourcePage, assetPath(page.sourcePage)]));
  const expected = storyWeaverPageRecords(fixture.pages, imagePaths);
  if (!Array.isArray(book.pages) || book.pages.length !== expected.length) fail('page count');
  const normalized = page => ({text: page.text, sourcePage: page.sourcePage, image: page.image ?? null,
    imageFrame: page.imageFrame ?? null, imageLabels: page.imageLabels ?? null,
    wordless: page.wordless === true, textOnly: page.textOnly === true, imageAlt: page.imageAlt ?? null, audio: page.audio ?? null});
  for (const [index, page] of expected.entries()) {
    if (!isDeepStrictEqual(normalized(book.pages[index]), normalized(page))) fail(`source page ${page.sourcePage}`);
  }
}
