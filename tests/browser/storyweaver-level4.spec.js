import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const books = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url)));
const levelFour = books.filter(book => book.sourceLevel.system === 'StoryWeaver' && book.sourceLevel.value === 4);

test('StoryWeaver 4 is discoverable on phones and stays separate from Canada 4', async ({page}) => {
  await page.setViewportSize({width:320,height:740});
  await page.goto('/#/library');
  const choice = page.getByRole('button',{name:'StoryWeaver · 4级',exact:true});
  await expect(choice).toHaveAccessibleDescription(`${levelFour.length}本`);
  await choice.click();
  await expect(choice).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.library-book')).toHaveCount(levelFour.length);
  expect(await page.locator('.library-book').evaluateAll(cards => cards.map(card => card.dataset.bookId))).toEqual(levelFour.map(book => book.id));
  for (const book of levelFour) {
    const card = page.locator(`[data-book-id="${book.id}"]`);
    await expect(card.locator('.book-level')).toHaveText('StoryWeaver 4级');
    await expect(card.locator('.narration-note')).toHaveText('系统朗读');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Storybooks Canada · 4级',exact:true}).click();
  await expect(page.locator('.library-book')).toHaveCount(4);
  expect(await page.locator('.library-book').evaluateAll(cards => cards.every(card => !card.dataset.bookId.startsWith('sw-')))).toBe(true);
});

test('the new fourth-level image group downloads at a subpath and remains readable offline', async ({page,context}) => {
  test.setTimeout(90000);
  const base = 'http://localhost:4179/reading-garden/';
  await page.goto(`${base}#/parent`);
  await page.getByRole('button',{name:'长按进入',exact:true}).click({delay:1150});
  await expect(page.locator('#download-scope')).toBeVisible();
  await page.locator('#download-scope').selectOption('level:StoryWeaver:4');
  await page.getByRole('button',{name:'下载离线故事包',exact:true}).click();
  await expect(page.locator('#download-status')).toContainText('已下载StoryWeaver · 4级故事',{timeout:60000});
  const group = await page.evaluate(async () => {
    const manifest = await fetch('./precache.json').then(response => response.json());
    return Object.entries(manifest.books).filter(([,book]) => book.levelKey === 'StoryWeaver:4');
  });
  expect(group.map(([id]) => id)).toEqual(levelFour.map(book => book.id));
  for (const [id,book] of group) {
    expect(book.files).toHaveLength(levelFour.find(item => item.id === id).pages.length+1);
    expect(book.files.every(path => path.startsWith(`assets/books/${id}/`) && path.endsWith('.jpg'))).toBe(true);
  }
  await context.setOffline(true);
  for (const book of levelFour) {
    for (const index of [0,book.pages.length-1]) {
      await page.goto(`${base}#/book/${book.id}/${index+1}`);
      await page.reload();
      await expect(page.getByRole('heading',{name:book.title,exact:true})).toBeVisible();
      await expect(page.locator('.reading-spread')).toHaveAttribute('aria-label',`第${index+1}页`);
      await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth>0)).toBe(true);
      if (book.pages[index].wordless) await expect(page.locator('.story-text')).toHaveCount(0);
      else await expect(page.locator('.story-text')).toHaveText(book.pages[index].text);
      await expect(page.locator('[data-page-play]')).toHaveCount(book.pages[index].wordless ? 0 : 1);
    }
  }
});
