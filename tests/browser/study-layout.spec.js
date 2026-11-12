import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const books=JSON.parse(await readFile(new URL('../../web/data/books.json',import.meta.url)));
const fits = async page => expect(await page.evaluate(()=>Math.max(document.documentElement.scrollHeight-innerHeight,document.documentElement.scrollWidth-innerWidth))).toBeLessThanOrEqual(2);
test('landscape reading keeps navigation visible and preserves long text and credits',async({page})=>{
 await page.setViewportSize({width:1024,height:768});
 for(const route of ['0087/1','sw-19019/14','sw-20032/4']){
  await page.goto('/#/book/'+route);await page.evaluate(()=>document.fonts.ready);
  await fits(page);await expect(page.locator('[data-next]')).toBeInViewport();
  await expect(page.locator('[data-download-book]')).toHaveCount(0);
 }
 await expect(page.locator('.reader-credit')).toHaveCount(0);
 await page.goto('/#/book/sw-266453/17');
 await expect(page.locator('.story-text')).toHaveText(books.find(book=>book.id==='sw-266453').pages[16].text);
 expect(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight)).toBe(true);
 await page.locator('[data-next]').click();await expect(page).toHaveURL(/\/18$/);
});
test('pinyin keeps choices reachable and teaching notes visible without clipping',async({page})=>{
 await page.setViewportSize({width:1024,height:768});await page.goto('/#/pinyin');
 for(const tab of ['finals','initials','whole','tones','quiz']){
  await page.locator(`[data-pinyin-tab="${tab}"]`).click();await page.evaluate(()=>document.fonts.ready);if(tab!=='tones')await fits(page);
  const buttons=page.locator('.study-workspace button');
  for(const button of await buttons.all()){if(await button.isVisible()) {const box=await button.boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(768);}}
 }
 const answers=await page.locator('[data-answer]').evaluateAll(es=>es.map(e=>e.dataset.answer));
 for(const id of answers){if(await page.locator('[data-next-quiz]').count())break;await page.locator(`[data-answer="${id}"]`).click();}
 await expect(page.locator('[data-next-quiz]')).toBeVisible();
 await expect(page.locator('.quiz-lesson > .small-note')).toBeVisible();
 await expect(page.locator('.quiz-lesson details')).toHaveCount(0);
 await page.locator('[data-pinyin-tab="tones"]').click();
 await expect(page.getByText('每组完整音节都可以听四声。', {exact:false})).toBeVisible();
 await expect(page.locator('.study-stage details')).toHaveCount(0);
 await page.locator('[data-pinyin-tab="initials"]').click();await page.locator('[data-pinyin-item="initial-l"]').click();await fits(page);
 await page.locator('[data-pinyin-tab="finals"]').click();await expect(page.locator('[data-pinyin-item]')).toHaveCount(24);
 await page.locator('[data-pinyin-item]').last().click();await expect(page.locator('.vowel-lesson')).toContainText('ong');
});
test('phone keeps natural reading flow without horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const hash of ['#/book/0087/1','#/pinyin']){
  await page.goto('/'+hash);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 }
 await page.locator('[data-pinyin-tab="tones"]').click();await expect(page.locator('.tone-card')).toHaveCount(4);
});
