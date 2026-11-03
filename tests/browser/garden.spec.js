import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    window.__plays = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) { window.__plays.push(this.src); window.__lastAudio = this; return play.apply(this, args); };
  });
});

test('read, collect a character, restore progress and finish deliberately', async ({page}) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.book-card')).toHaveCount(3);
  await expect(page.locator('.hero')).toBeVisible();
  expect(await page.evaluate(() => window.__plays)).toEqual([]);
  await page.getByRole('link', {name: '打开故事', exact: true}).click();
  await expect(page.getByRole('heading', {name: '我喜欢看书', exact: true})).toBeVisible();
  await expect(page.locator('.story-text')).toHaveText('我喜欢看书。');
  await page.getByRole('button', {name: '读这一页'}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', {name: '认识书', exact: true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => window.__lastAudio.paused)).toBe(true);
  await page.getByRole('button', {name: '放进生字篮'}).click();
  await expect(page.getByRole('button', {name: '已放进生字篮'})).toBeDisabled();
  await page.getByRole('button', {name: '听原句', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBe(2);
  await page.getByRole('button', {name: '关闭', exact: true}).click();
  await page.getByRole('button', {name: '下一页', exact: true}).click();
  await expect(page.locator('.story-text')).toHaveText('我可以念给谁听呢？');
  await page.reload();
  await expect(page.locator('.story-text')).toHaveText('我可以念给谁听呢？');
  await page.getByRole('link', {name: '回到书架'}).click();
  await page.getByRole('link', {name: /我的生字/}).click();
  await expect(page.locator('.saved-word')).toHaveCount(1);
  await page.getByRole('button', {name: '复习书', exact: true}).click();
  await expect(page.getByRole('dialog')).toContainText('看书');
  await page.getByRole('button', {name: '关闭', exact: true}).click();
  await page.goto('/#/book/0087/8');
  await expect(page.getByRole('button', {name: '读完啦'})).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')).progress['0087'].finished)).toBe(false);
  await page.getByRole('button', {name: '读完啦'}).click();
  await expect(page.getByRole('heading', {name: '又认识了一个小世界。'})).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')).progress['0087'].finished)).toBe(true);
  expect(errors).toEqual([]);
});

test('pinyin is a separate lesson with playable examples and retryable listening practice', async ({page}) => {
  await page.goto('/#/pinyin');
  await expect(page.getByRole('heading', {name: '听听声音，动动小嘴巴。'})).toBeVisible();
  await expect(page.locator('.vowel-picker button')).toHaveCount(6);
  for (const symbol of ['a', 'e', 'i', 'ü']) {
    await page.getByRole('button', {name: `单韵母${symbol}`, exact: true}).click();
    await expect(page.getByRole('button', {name: '示范音待补充', exact: true})).toBeDisabled();
  }
  expect(await page.evaluate(() => window.__plays)).toEqual([]);
  await page.getByRole('button', {name: '单韵母o', exact: true}).click();
  await page.getByRole('button', {name: '听听例字', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain('/pinyin/o.mp3');
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', {name: '听听四声', exact: true}).click();
  await expect(page.getByRole('button', {name: '听第一声bā', exact: true})).toBeDisabled();
  await expect(page.getByRole('button', {name: '听第三声bǎ', exact: true})).toBeDisabled();
  for (const [n, label] of [[2, '第二声bá'], [4, '第四声bà']]) {
    await page.getByRole('button', {name: `听${label}`, exact: true}).click();
    await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain(`/tone${n}.mp3`);
  }
  await page.getByRole('button', {name: '听音找朋友', exact: true}).click();
  await page.getByRole('button', {name: '播放题目声音'}).click();
  await expect(page.locator('[data-answer]')).toHaveCount(2);
  expect(await page.locator('[data-answer]').evaluateAll(buttons => buttons.every(button => ['o', 'u'].includes(button.dataset.answer)))).toBe(true);
  const src = await page.evaluate(() => window.__plays.at(-1));
  const answer = src.split('/').at(-1).replace('.mp3', '');
  const symbol = {a: 'a', o: 'o', e: 'e', i: 'i', u: 'u', v: 'ü'}[answer];
  // Select by DOM attribute so the random order does not affect the assertion.
  await page.locator(`[data-answer]:not([data-answer="${answer}"])`).first().click();
  await expect(page.locator('.quiz-feedback')).toHaveText('再听一听，慢慢找。');
  await page.getByRole('button', {name: `选择${symbol}`, exact: true}).click();
  await expect(page.locator('.quiz-feedback')).toContainText('找到了');
  await page.getByRole('button', {name: '再找一个'}).click();
  await expect(page.locator('.quiz-feedback')).toContainText('不着急');
  await page.goto('/#/book/0156/1');
  await expect(page.locator('.story-text')).not.toContainText('ā');
});

test('iPad rotation and mobile layouts keep content inside the viewport', async ({page}, testInfo) => {
  for (const size of [{width: 1194, height: 834}, {width: 820, height: 1180}, {width: 390, height: 844}]) {
    await page.setViewportSize(size);
    for (const path of ['/', '/#/book/0009/4', '/#/pinyin', '/#/parent']) {
      await page.goto(path);
      await expect(page.locator('#main')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      expect(overflow, `${path} at ${size.width}`).toBe(false);
      if (path.includes('book')) {
        await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        await page.getByRole('button', {name: '切换大字阅读'}).click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
      }
    }
  }
  if (testInfo.project.name === 'ipad-chromium') {
    await page.setViewportSize({width: 1194, height: 834}); await page.goto('/');
    await page.screenshot({path: 'test-results/shelf-ipad.png', fullPage: true});
    await page.goto('/#/book/0087/3');
    await page.screenshot({path: 'test-results/reader-ipad.png', fullPage: true});
    await page.goto('/#/pinyin');
    await page.screenshot({path: 'test-results/pinyin-ipad.png', fullPage: true});
  }
});

test('downloaded library works offline including audio byte ranges at a project subpath', async ({page, context}) => {
  await page.goto('http://localhost:4179/reading-garden/#/parent');
  await expect(page.getByRole('button', {name: '下载离线故事包'})).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once: true})); });
  await page.getByRole('button', {name: '下载离线故事包'}).click();
  await expect(page.locator('#download-status')).toContainText('已下载全部故事', {timeout: 20000});
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', {name: '陪她读，也给她一点空间。'})).toBeVisible();
  await page.getByRole('link', {name: '故事书架', exact: true}).click();
  await expect(page.locator('.book-card')).toHaveCount(3);
  await page.locator('.book-card').nth(2).click();
  await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', {name: '读这一页'}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain('/reading-garden/assets/books/0009/02.mp3');
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  const range = await page.evaluate(async () => { const r = await fetch('./assets/books/0009/02.mp3', {headers: {Range: 'bytes=0-15'}}); return {status: r.status, bytes: (await r.arrayBuffer()).byteLength, contentRange: r.headers.get('Content-Range')}; });
  expect(range.status).toBe(206); expect(range.bytes).toBe(16); expect(range.contentRange).toMatch(/^bytes 0-15\//);
  await page.goto('http://localhost:4179/reading-garden/#/pinyin');
  await page.getByRole('button', {name: '单韵母o', exact: true}).click();
  await page.getByRole('button', {name: '听听例字'}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain('/reading-garden/assets/pinyin/o.mp3');
  const removedIsPlayable = await page.evaluate(async () => fetch('./assets/pinyin/a.mp3').then(response => response.ok, () => false));
  expect(removedIsPlayable).toBe(false);
});

test('storage corruption is recoverable and clearing data requires a deliberate confirmation', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('reading-garden-v1', '{broken'));
  await page.reload();
  await expect(page.locator('.book-card')).toHaveCount(3);
  await page.goto('/#/book/0156/2');
  await page.goto('/#/parent');
  await page.getByRole('button', {name: '清除本机阅读记录和生字篮'}).click();
  await page.getByRole('button', {name: '保留记录'}).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')).progress['0156'].page)).toBe(1);
  await page.getByRole('button', {name: '清除本机阅读记录和生字篮'}).click();
  await page.getByRole('button', {name: '确认清除'}).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')).progress)).toEqual({});
});

test('failed persistent storage stays usable and does not claim the word was saved', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.goto('/#/book/0087/1');
  await page.getByRole('button', {name: '认识书', exact: true}).click();
  await page.getByRole('button', {name: '放进生字篮'}).click();
  await expect(page.getByRole('button', {name: '本次先收好'})).toBeDisabled();
  await expect(page.locator('#status')).toContainText('暂时无法保存');
  await page.getByRole('button', {name: '关闭', exact: true}).click();
  await page.getByRole('button', {name: '下一页', exact: true}).click();
  await expect(page.locator('.story-text')).toHaveText('我可以念给谁听呢？');
});

test('audio playback errors give a retry without blocking navigation', async ({page}) => {
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = async () => { throw new DOMException('Cannot play', 'NotSupportedError'); }; });
  await page.goto('/#/book/0156/1');
  await page.getByRole('button', {name: '读这一页'}).click();
  await expect(page.locator('#status')).toContainText('声音暂时没有播放成功');
  await expect(page.getByRole('button', {name: '读这一页'})).toBeVisible();
  await page.getByRole('button', {name: '下一页', exact: true}).click();
  await expect(page.locator('.story-text')).toContainText('慢慢');
});
