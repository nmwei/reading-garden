import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const book = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url))).find(book => book.id === 'sw-92448');

test('silent story retains all twelve illustrated pages, character help and completion', async ({page}) => {
  const errors = [], missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
  await page.addInitScript(() => Object.defineProperty(speechSynthesis, 'getVoices', {value: () => []}));
  await page.goto('/#/book/sw-92448/1');
  await expect(page.locator('.reader-meta')).toContainText('StoryWeaver · 2级');
  await expect(page.locator('[data-page-play]')).toHaveCount(0);
  await page.getByRole('button', {name:'认识奶',exact:true}).first().click();
  await expect(page.locator('[data-word-listen]')).toHaveCount(0);
  await page.getByRole('button', {name:'听“奶”的读音',exact:true}).click();
  await expect(page.locator('#status')).toContainText('请家长帮忙读一读');
  await page.getByRole('button', {name:'放进生字篮',exact:true}).click();
  await page.getByRole('button', {name:'关闭',exact:true}).click();
  for (let index = 0; index < book.pages.length; index++) {
    await expect(page.locator('.story-text')).toHaveText(book.pages[index].text);
    await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(page.locator('[data-page-play]')).toHaveCount(0);
    await page.locator('[data-next]').click();
  }
  await expect(page.locator('.completion')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')));
  expect(saved.progress['sw-92448'].finished).toBe(true);
  expect(saved.words).toContainEqual({char:'奶',bookId:'sw-92448',page:0});
  await page.goto('/#/words');
  await page.getByRole('button', {name:'复习奶',exact:true}).click();
  await expect(page.locator('[data-word-listen]')).toHaveCount(0);
  expect(errors).toEqual([]); expect(missing).toEqual([]);
});

test('source levels and downloads never mix StoryWeaver 2 with Storybooks Canada 2', async ({page}) => {
  await page.goto('/#/library');
  await page.getByRole('button', {name:'StoryWeaver · 2级',exact:true}).click();
  await expect(page.locator('.book-card')).toHaveCount(1);
  await expect(page.locator('.book-level')).toHaveText('StoryWeaver 2级');
  await expect(page.locator('.narration-note')).toHaveText('亲子共读');
  await page.getByRole('button', {name:'把《绘画游戏》放到小书架',exact:true}).click();
  await page.locator('.library-toolbar a').click();
  await expect(page.locator('[data-book-id="sw-92448"]')).toBeVisible();
  await page.goto('/#/book/sw-92448/4'); await page.reload();
  await expect(page.locator('.story-text')).toContainText('活动：');
  await page.getByText('这本书的作者与来源',{exact:true}).click();
  await expect(page.locator('.reader-credit')).toContainText('© Jala, 2019');
  await expect(page.locator('.reader-credit')).toContainText('CC BY 4.0');
  await expect(page.getByRole('link',{name:'StoryWeaver 原文',exact:true})).toHaveAttribute('href',book.source);
  await expect(page.locator('.reader-credit')).not.toContainText('undefined');
  await page.goto('/#/library');
  await page.getByRole('button', {name:'Storybooks Canada · 2级',exact:true}).click();
  await expect(page.locator('.book-card')).toHaveCount(11);
  await expect(page.locator('[data-book-id="sw-92448"]')).toHaveCount(0);
  await page.locator('.book-card').first().click();
  await expect(page.locator('[data-page-play]')).toBeVisible();
});

test('image-only download set supports offline text and illustrations at a project subpath', async ({page,context}) => {
  await page.goto('http://localhost:4179/reading-garden/#/book/sw-92448/1');
  await page.getByRole('button', {name:'下载这本书',exact:true}).click();
  await expect(page.locator('#book-download-status')).toContainText('已下载《绘画游戏》');
  const info = await page.evaluate(async () => (await fetch('./precache.json').then(r => r.json())).books['sw-92448']);
  expect(info.files).toHaveLength(13);
  expect(info.files.every(path => path.endsWith('.jpg'))).toBe(true);
  expect(info.bytes).toBeGreaterThan(0);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.story-text')).toHaveText(book.pages[0].text);
  await page.locator('[data-next]').click();
  await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', {name:'认识圆',exact:true}).click();
  await page.getByRole('button', {name:'放进生字篮',exact:true}).click();
  await expect(page.getByRole('button', {name:'移出生字篮',exact:true})).toBeVisible();
});

test('new story and qualified cards fit phone, iPad and desktop without cropped artwork', async ({page}, testInfo) => {
  for (const [name,width,height] of [['ipad-landscape',1194,834],['ipad-portrait',820,1180],['phone',390,844],['small-phone',320,740],['pc',1440,1000]]) {
    await page.setViewportSize({width,height});
    await page.goto('/#/book/sw-92448/8');
    await expect(page.locator('.story-text')).toContainText('正方形');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.page-art img').evaluate(img => getComputedStyle(img).objectFit)).toBe('contain');
    if (name === 'ipad-landscape') await page.screenshot({path:testInfo.outputPath('drawing-ipad.png'),fullPage:true});
    await page.goto('/#/library');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
