import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {readingLevelOptions} from '../../app/reading-levels.js';

const books = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url)));
const inLevel = (system, value, catalog = books) => catalog.filter(book => book.sourceLevel.system === system && book.sourceLevel.value === value);
const weaverCounts = readingLevelOptions(books).filter(level => level.system === 'StoryWeaver').map(level => `${inLevel(level.system, level.value).length}本`);

test('source groups have separate selections, useful counts and a clear reset', async ({page}) => {
  await page.goto('/#/library');
  const canada = page.getByRole('group', {name:'Storybooks Canada',exact:true});
  const weaver = page.getByRole('group', {name:'StoryWeaver',exact:true});
  await expect(canada.locator('.level-option small')).toHaveText(['15本','11本','8本','4本','2本']);
  await expect(weaver.locator('.level-option small')).toHaveText(weaverCounts);
  await page.getByRole('button', {name:'Storybooks Canada · 2级',exact:true}).click();
  await expect(page.locator('.book-card')).toHaveCount(11);
  await expect(page.locator('[data-book-level][aria-pressed=true]')).toHaveCount(1);
  await page.getByRole('button', {name:'StoryWeaver · 2级',exact:true}).click();
  await expect(page.locator('.book-card')).toHaveCount(inLevel('StoryWeaver', 2).length);
  expect(await page.locator('.library-book').evaluateAll(cards => cards.map(card => card.dataset.bookId))).toEqual(inLevel('StoryWeaver', 2).map(book => book.id));
  await expect(page.locator('[data-book-level="Storybooks Canada:2"]')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('[data-book-level="StoryWeaver:2"]')).toHaveAccessibleDescription(`${inLevel('StoryWeaver', 2).length}本`);
  await page.getByRole('button', {name:'全部级别',exact:true}).click();
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  await expect(page.locator('[data-book-level][aria-pressed=true]')).toHaveCount(1);
});

test('counts follow theme and reading scope without being narrowed by the selected level', async ({page}) => {
  await page.goto('/#/library');
  await page.locator('#book-theme').selectOption('生活发现');
  const themed = books.filter(book => book.tag === '生活发现');
  await expect(page.locator('.level-all small')).toHaveText(`${themed.length}本`);
  await expect(page.locator('[data-book-level="Storybooks Canada:2"] small')).toHaveText('3本');
  await page.getByRole('button', {name:'Storybooks Canada · 2级',exact:true}).click();
  await expect(page.locator('.book-card')).toHaveCount(3);
  await expect(page.locator('[data-book-level="StoryWeaver:2"] small')).toHaveText(`${inLevel('StoryWeaver', 2, themed).length}本`);
  await page.goto('/#/book/0087/1'); await expect(page.locator('.story-text')).toBeVisible();
  await page.goto('/#/book/sw-92448/1'); await expect(page.locator('.story-text')).toBeVisible();
  await page.goto('/#/library');
  await page.locator('#book-theme').selectOption('全部故事');
  await page.getByRole('button', {name:'全部级别',exact:true}).click();
  await page.getByRole('button', {name:'阅读中',exact:true}).click();
  await expect(page.locator('.level-all small')).toHaveText('2本');
  await page.locator('#book-theme').selectOption('生活发现');
  await expect(page.locator('.level-all small')).toHaveText('1本');
  await expect(page.locator('[data-book-level="Storybooks Canada:1"] small')).toHaveText('0本');
  await page.getByRole('button', {name:'Storybooks Canada · 1级',exact:true}).click();
  await expect(page.locator('.book-card')).toHaveCount(0);
  await page.getByRole('button', {name:'全部级别',exact:true}).click();
  await expect(page.locator('.book-card')).toHaveCount(1);
});

test('keyboard activation retains focus, a visible outline and the control position', async ({page}) => {
  await page.goto('/#/library');
  const first = page.getByRole('button', {name:'Storybooks Canada · 1级',exact:true});
  // iPad WebKit's native Tab policy can skip buttons; exercise activation and
  // focus restoration without assuming a user's Full Keyboard Access setting.
  await first.focus();
  await expect(first).toBeFocused();
  const before = await first.boundingBox();
  await first.press('Enter');
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('aria-pressed','true');
  expect(Math.abs((await first.boundingBox()).y - before.y)).toBeLessThan(1);
  expect(await first.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(3);
  await expect(page.locator('.book-card')).toHaveCount(15);
});

test('five grades stay on one line with touch-sized controls across responsive breakpoints', async ({page},testInfo) => {
  await page.goto('/#/library');
  for (const width of [320,375,390,620,720,721,820,1024,1194,1440]) {
    await page.setViewportSize({width,height:width===820 ? 1180 : 900});
    const layout = await page.locator('.level-filters').evaluate(el => {
      const box = el.getBoundingClientRect();
      const buttons = [...el.querySelectorAll('[data-book-level]')].map(b => b.getBoundingClientRect());
      const grades = [...el.querySelector('[data-level-system="Storybooks Canada"]').querySelectorAll('.level-option')].map(b => b.getBoundingClientRect());
      return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
        buttonsFit:buttons.every(b => b.width>=44 && b.height>=44 && b.left>=box.left && b.right<=box.right+1),
        sameLine:grades.every(b => Math.abs(b.top-grades[0].top)<1)};
    });
    expect(layout,`filter layout at ${width}px`).toEqual({width,overflow:false,buttonsFit:true,sameLine:true});
    if (width===390 || width===1194) await page.screenshot({path:testInfo.outputPath(`level-filters-${width}.png`),fullPage:false});
  }
});
