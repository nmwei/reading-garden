import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const books = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url)));
const catalog = books.filter(book => book.sourceLevel.system === 'StoryWeaver');

for (const book of catalog) {
  test(`${book.id} ${book.title}: every source page renders in order and completion stays deliberate`, async ({page}) => {
    test.setTimeout(60000);
    const errors = [], missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status()>=400) missing.push(response.url()); });
    await page.goto(`/#/book/${book.id}/1`);
    await expect(page.getByRole('heading',{name:book.title,exact:true})).toBeVisible();
    for (const [index, source] of book.pages.entries()) {
      await expect(page.locator('.reading-spread')).toHaveAttribute('aria-label',`第${index+1}页`);
      await expect(page.locator('.page-dots [aria-current=page]')).toHaveAttribute('data-page',String(index));
      if (source.wordless) {
        await expect(page.locator('.story-text, .reading-hint, .character')).toHaveCount(0);
      } else {
        await expect(page.locator('.story-text')).toHaveText(source.text);
        await expect(page.locator('.character').first()).toBeVisible();
      }
      if (source.textOnly) {
        await expect(page.locator('.page-art')).toHaveCount(0);
        await expect(page.locator('.reading-spread')).toHaveClass(/text-only/);
      } else {
        await expect(page.locator('.page-art img')).toHaveAttribute('src',source.image);
        await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth>0)).toBe(true);
      }
      await expect(page.locator('.art-label')).toHaveText((source.imageLabels || []).map(label => label.text));
      await expect(page.locator('[data-page-play]')).toHaveCount(source.wordless ? 0 : 1);
      await expect(page.locator('.completion')).toHaveCount(0);
      if (index === book.pages.length-1) {
        const progress = await page.evaluate(id => JSON.parse(localStorage.getItem('reading-garden-v1')).progress[id],book.id);
        expect(progress.finished).toBe(false);
        expect(progress.page).toBe(index);
      }
      await page.locator('[data-next]').click();
    }
    await expect(page.locator('.completion')).toBeVisible();
    const progress = await page.evaluate(id => JSON.parse(localStorage.getItem('reading-garden-v1')).progress[id],book.id);
    expect(progress.finished).toBe(true);
    expect(progress.page).toBe(book.pages.length-1);
    expect(errors).toEqual([]);
    expect(missing).toEqual([]);
  });

  test(`${book.id} ${book.title}: mobile first and last pages fit without losing their controls`, async ({page}) => {
    test.setTimeout(45000);
    const samples = [[320,0],[390,0],[390,book.pages.length-1]];
    for (const [width,index] of samples) {
      await page.setViewportSize({width,height:844});
      await page.goto(`/#/book/${book.id}/${index+1}`);
      await expect(page.locator('.reading-spread')).toHaveAttribute('aria-label',`第${index+1}页`);
      await expect(page.locator('[data-next]')).toBeVisible();
      await expect(page.locator('[data-prev]')).toBeVisible();
      if (book.pages[index].textOnly) await expect(page.locator('.page-art')).toHaveCount(0);
      else await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth>0)).toBe(true);
      const layout = await page.locator('.reading-spread').evaluate(el => {
        const spread = el.getBoundingClientRect(), words = el.querySelector('.page-words').getBoundingClientRect();
        const next = document.querySelector('[data-next]').getBoundingClientRect(), previous = document.querySelector('[data-prev]').getBoundingClientRect();
        return {overflow:document.documentElement.scrollWidth>innerWidth,
          textInside:words.left>=spread.left && words.right<=spread.right,
          controlsInside:next.right<=innerWidth && previous.left>=0,
          sameRow:Math.abs(next.top-previous.top)<1};
      });
      expect(layout,`${book.id} page ${index+1} at ${width}px`).toEqual({overflow:false,textInside:true,controlsInside:true,sameRow:true});
    }
  });
}
