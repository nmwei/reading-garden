import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const books = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url)));
const book = books.find(book => book.id === 'sw-92448');

test('system narration uses the saved voice for both the page and the selected sentence', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('reading-garden-v1', JSON.stringify({voice:'chosen'}));
    window.spoken = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; }
    };
    Object.defineProperty(window, 'speechSynthesis', {configurable:true,value:{
      getVoices: () => [
        {name:'First voice',voiceURI:'first',lang:'zh-CN'},
        {name:'Chosen voice',voiceURI:'chosen',lang:'zh-CN'}
      ],
      cancel() { window.currentSpeech = null; },
      speak(utterance) {
        window.currentSpeech = utterance;
        window.spoken.push({text:utterance.text,voice:utterance.voice.voiceURI});
      },
      addEventListener() {}
    }});
  });
  await page.goto('/#/book/sw-92448/1');
  await expect(page.locator('.reader-meta')).toContainText('系统朗读');
  const listen = page.locator('[data-page-play]');
  await listen.click();
  await expect(listen).toHaveText('停止朗读');
  expect(await page.evaluate(() => window.spoken)).toEqual([{text:book.pages[0].text,voice:'chosen'}]);
  await page.getByRole('button',{name:'认识粉',exact:true}).click();
  expect(await page.evaluate(() => window.currentSpeech)).toBeNull();
  await page.getByRole('button',{name:'听这一句',exact:true}).click();
  expect(await page.evaluate(() => window.spoken.at(-1))).toEqual({text:'奶奶说：“去拿一块粉笔，我们来玩个游戏。”',voice:'chosen'});
  await expect(listen).toHaveText('读这一页');
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await listen.click();
  await page.locator('[data-next]').click();
  await expect(page.locator('.story-text')).toHaveText(book.pages[1].text);
  expect(await page.evaluate(() => window.currentSpeech)).toBeNull();
  await expect(listen).toHaveText('读这一页');
});

test('silent story retains all twelve illustrated pages, character help and completion', async ({page}) => {
  const errors = [], missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) missing.push(response.url()); });
  await page.addInitScript(() => Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {getVoices: () => [], cancel() {}, addEventListener() {}}
  }));
  await page.goto('/#/book/sw-92448/1');
  await expect(page.locator('.reader-meta')).toContainText('StoryWeaver · 2级');
  await expect(page.locator('[data-page-play]')).toBeVisible();
  await page.getByRole('button', {name:'读这一页',exact:true}).click();
  await expect(page.locator('#status')).toContainText('没有可用的中文声音');
  await page.getByRole('button', {name:'认识奶',exact:true}).first().click();
  await expect(page.locator('[data-word-listen]')).toBeVisible();
  await page.getByRole('button', {name:'听“奶”的读音',exact:true}).click();
  await expect(page.locator('#status')).toContainText('请家长帮忙读一读');
  await page.getByRole('button', {name:'放进生字篮',exact:true}).click();
  await page.getByRole('button', {name:'关闭',exact:true}).click();
  for (let index = 0; index < book.pages.length; index++) {
    await expect(page.locator('.story-text')).toHaveText(book.pages[index].text);
    await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(page.locator('[data-page-play]')).toBeVisible();
    await page.locator('[data-next]').click();
  }
  await expect(page.locator('.completion')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')));
  expect(saved.progress['sw-92448'].finished).toBe(true);
  expect(saved.words).toContainEqual({char:'奶',bookId:'sw-92448',page:0});
  await page.goto('/#/words');
  await page.getByRole('button', {name:'复习奶',exact:true}).click();
  await expect(page.locator('[data-word-listen]')).toBeVisible();
  expect(errors).toEqual([]); expect(missing).toEqual([]);
});

test.describe('wordless page compatibility', () => {
test.use({serviceWorkers:'block'});
test('wordless pages keep their place and illustration without consuming the first character-help hint', async ({page}) => {
  const sample = {...book, pages: [
    {...book.pages[0], text:'', wordless:true},
    book.pages[0],
    {...book.pages[1], text:'', wordless:true, imageAlt:'奶奶和孩子一起观察形状的无字插图'}
  ]};
  await page.route('**/data/books.json', route => route.fulfill({json: books.map(item => item.id === sample.id ? sample : item)}));
  await page.goto('/#/book/sw-92448/1');
  await expect(page.locator('.story-text, .reading-hint, [data-page-play]')).toHaveCount(0);
  await expect(page.locator('.page-art img')).toHaveAttribute('alt','《绘画游戏》第1页插图');
  await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  for (const width of [1194,390]) {
    await page.setViewportSize({width,height:900});
    const layout = await page.locator('.reading-spread').evaluate(el => {
      const art=el.querySelector('.page-art').getBoundingClientRect(), caption=el.querySelector('.page-words').getBoundingClientRect();
      return {sameWidth:Math.abs(art.width-caption.width)<1,below:caption.top>=art.bottom-1,compact:caption.height<80};
    });
    expect(layout).toEqual({sameWidth:true,below:true,compact:true});
  }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')).readingHelpSeen)).toBe(false);
  await expect(page.locator('[data-download-book]')).toBeVisible();
  await page.locator('[data-next]').click();
  await expect(page.locator('.story-text')).toHaveText(book.pages[0].text);
  await expect(page.locator('.reading-hint')).toBeVisible();
  await expect(page.getByRole('button',{name:'认识奶',exact:true}).first()).toBeVisible();
  await page.locator('[data-next]').click();
  await expect(page.locator('.story-text, .reading-hint, [data-page-play]')).toHaveCount(0);
  await expect(page.locator('.page-art img')).toHaveAttribute('alt',sample.pages[2].imageAlt);
  await expect(page.locator('.page-dots [aria-current=page]')).toHaveAttribute('data-page','2');
  await page.reload();
  await expect(page.locator('.story-text, .reading-hint')).toHaveCount(0);
  await expect(page.locator('.completion')).toHaveCount(0);
  await page.locator('[data-next]').click();
  await expect(page.locator('.completion')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')));
  expect(saved.progress['sw-92448'].page).toBe(2);
  expect(saved.progress['sw-92448'].finished).toBe(true);
  expect(saved.readingHelpSeen).toBe(true);
  expect(saved.words).toEqual([]);
});
test('explicit text-only pages preserve character help and page order without broken image requests', async ({page}) => {
  const {image, imageFrame, ...firstText} = book.pages[0];
  const sample = {...book, pages:[book.pages[0], {...firstText,textOnly:true}, book.pages[1]]};
  const missing = [];
  page.on('response', response => { if (response.status()>=400) missing.push(response.url()); });
  await page.route('**/data/books.json', route => route.fulfill({json:books.map(item => item.id===sample.id ? sample : item)}));
  await page.goto('/#/book/sw-92448/2');
  await expect(page.locator('.reading-spread')).toHaveClass(/text-only/);
  await expect(page.locator('.page-art')).toHaveCount(0);
  await expect(page.locator('[data-page-play]')).toBeVisible();
  await expect(page.locator('.story-text')).toHaveText(firstText.text);
  await expect(page.locator('.reading-hint')).toBeVisible();
  await expect(page.locator('[data-download-book]')).toBeVisible();
  for (const width of [320,820,1440]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.locator('.story-text').evaluate(el => {
      const text = el.getBoundingClientRect(), spread = document.querySelector('.reading-spread').getBoundingClientRect();
      return text.left>=spread.left && text.right<=spread.right && document.documentElement.scrollWidth<=innerWidth;
    })).toBe(true);
  }
  await page.getByRole('button',{name:'认识奶',exact:true}).first().click();
  await page.getByRole('button',{name:'放进生字篮',exact:true}).click();
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await page.locator('[data-next]').click();
  await expect(page.locator('.story-text')).toHaveText(book.pages[1].text);
  await expect(page.locator('.page-art img')).toHaveAttribute('src',book.pages[1].image);
  await page.locator('[data-prev]').click();
  await page.reload();
  await expect(page.locator('.page-art')).toHaveCount(0);
  await expect(page.locator('.story-text')).toHaveText(firstText.text);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')));
  expect(saved.progress['sw-92448'].page).toBe(1);
  expect(saved.words).toContainEqual({char:'奶',bookId:'sw-92448',page:1});
  expect(missing).toEqual([]);
});
});

test('constellation diagram keeps all nine positioned numbers attached to its original illustration', async ({page}, testInfo) => {
  const constellation = books.find(book => book.id === 'sw-266466');
  expect(constellation, 'reviewed constellation story must be present').toBeDefined();
  const diagramIndex = constellation.pages.findIndex(page => page.sourcePage === 18);
  expect(diagramIndex).toBeGreaterThanOrEqual(0);
  expect(constellation.pages[diagramIndex].imageLabels.map(label => label.text)).toEqual(['1','2','3','4','5','6','7','8','9']);
  for (const width of [390,1194]) {
    await page.setViewportSize({width,height:900});
    await page.goto(`/#/book/${constellation.id}/${diagramIndex+1}`);
    await expect(page.locator('.art-label')).toHaveText(['1','2','3','4','5','6','7','8','9']);
    const bareDigits = await page.locator('.story-text').allTextContents();
    expect(bareDigits.some(text => /^\s*1\s+2\s+3\s+4\s+5\s+6\s+7\s+8\s+9\s*$/.test(text))).toBe(false);
    expect(await page.locator('.art-frame').evaluate(el => {
      const frame = el.getBoundingClientRect();
      return [...el.querySelectorAll('.art-label')].every(label => {
        const box = label.getBoundingClientRect();
        return box.left>=frame.left && box.top>=frame.top && box.right<=frame.right+1 && box.bottom<=frame.bottom+1;
      });
    })).toBe(true);
    await page.locator('.page-art').screenshot({path:testInfo.outputPath(`star-diagram-${width}.png`)});
  }
});

test('source levels and downloads never mix StoryWeaver 2 with Storybooks Canada 2', async ({page}) => {
  await page.goto('/#/library');
  await page.getByRole('button', {name:'StoryWeaver · 2级',exact:true}).click();
  const weaverTwo = books.filter(book => book.sourceLevel.system === 'StoryWeaver' && book.sourceLevel.value === 2);
  await expect(page.locator('.book-card')).toHaveCount(weaverTwo.length);
  expect(await page.locator('.library-book').evaluateAll(cards => cards.map(card => card.dataset.bookId))).toEqual(weaverTwo.map(book => book.id));
  const drawing = page.locator('[data-book-id="sw-92448"]');
  await expect(drawing.locator('.book-level')).toHaveText('StoryWeaver 2级');
  await expect(drawing.locator('.narration-note')).toHaveText('系统朗读');
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
