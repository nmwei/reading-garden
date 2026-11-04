import {test as base, expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {TONE_BASES} from '../../app/pinyin.js';
const books = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url)));

// Real server faults exercise worker-owned network requests in both browser engines.
const test = base.extend({
  updateHost: async ({}, use) => {
    const root = fileURLToPath(new URL('../../dist/', import.meta.url)), overrides = new Map(), requests = [];
    const types = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json'};
    const server = createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        requests.push(pathname);
        const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
        if (!file.startsWith(root)) { response.writeHead(404); response.end(); return; }
        const override = overrides.get(pathname);
        const bytes = override?.body ?? await readFile(file);
        response.writeHead(override?.status || 200, {'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
        response.end(bytes);
      } catch { response.writeHead(404); response.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try { await use({url: `http://127.0.0.1:${server.address().port}`, overrides, requests, manifest: JSON.parse(await readFile(resolve(root, 'precache.json'), 'utf8'))}); }
    finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
  }
});

async function enterParent(page) {
  await page.getByRole('button', {name: '长按进入', exact: true}).click({delay: 1150});
  await expect(page.getByRole('heading', {name: '陪她读，也给她一点空间。'})).toBeVisible();
}

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    window.__plays = []; window.__playTimes = []; window.__ends = [];
    const observed = new WeakSet();
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) { window.__plays.push(this.src); window.__playTimes.push(performance.now()); window.__lastAudio = this;
      if (!observed.has(this)) { observed.add(this); this.addEventListener('ended', () => window.__ends.push({src: this.src, time: performance.now()})); } return play.apply(this, args); };
  });
});

test('read, collect a character, restore progress and finish deliberately', async ({page}) => {
  await page.addInitScript(() => Object.defineProperty(speechSynthesis, 'getVoices', {value: () => []}));
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.goto(new URL('#/library', page.url()).href);
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  await expect(page.locator('.book-level').first()).toHaveText('Storybooks Canada 1级');
  await expect(page.locator('.book-level').first()).toHaveAttribute('aria-label', 'Storybooks Canada · 1级（原站分级）');
  expect(await page.evaluate(() => window.__plays)).toEqual([]);
  await page.locator('.book-card[href="#/book/0087/1"]').click();
  await expect(page.getByRole('heading', {name: '我喜欢看书', exact: true})).toBeVisible();
  await expect(page.locator('.story-text')).toHaveText('我喜欢看书。');
  await page.getByRole('button', {name: '读这一页'}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', {name: '认识书', exact: true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => window.__lastAudio.paused)).toBe(true);
  await page.getByRole('button', {name: '放进生字篮'}).click();
  await expect(page.getByRole('button', {name: '移出生字篮', exact: true})).toBeEnabled();
  await page.getByRole('button', {name: '听这一句', exact: true}).click();
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

test('deliberate letter taps play while multi-selected practice stays explicit, fixed at three and persistent', async ({page}) => {
  await page.goto('/#/pinyin');
  await expect(page.locator('.final-row')).toHaveCount(5);
  await expect(page.locator('[data-pinyin-item]')).toHaveCount(24);
  expect(await page.evaluate(() => window.__plays)).toEqual([]);
  await page.getByRole('button', {name: '单韵母e', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', {name: '声母与 y w', exact: true}).click();
  expect(await page.evaluate(() => window.__lastAudio.paused)).toBe(true);
  await page.getByRole('button', {name: '声母b', exact: true}).click();
  const count = await page.evaluate(() => window.__plays.length);
  await page.getByRole('button', {name: '声母b', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBe(count + 1);
  await page.getByRole('button', {name: '听音找朋友', exact: true}).click();
  await expect(page.locator('.practice-scopes button')).toHaveCount(3);
  await expect(page.locator('select, .practice-settings, [data-quiz-scope="recent"]')).toHaveCount(0);
  await expect(page.locator('[data-question-scope]')).toHaveText('这一题 · 韵母');
  await expect(page.locator('[data-answer]')).toHaveCount(3);
  await page.locator('[data-quiz-scope="whole"]').click();
  await expect(page.locator('[data-practice-summary]')).toContainText('韵母、整体认读');
  const answerCurrent = async () => {
    await page.getByRole('button', {name: '播放题目声音'}).click();
    const src = await page.evaluate(() => window.__plays.at(-1));
    const answer = src.split('/').at(-1).replace('.mp3', '');
    await page.locator(`[data-answer]:not([data-answer="${answer}"])`).first().click();
    await expect(page.locator('.quiz-feedback')).toHaveText('再听一听，慢慢找。');
    await page.locator(`[data-answer="${answer}"]`).click();
    await expect(page.locator('.quiz-feedback')).toContainText('找到了');
  };
  await answerCurrent();
  await page.getByRole('button', {name: '再找一个'}).click();
  await expect(page.locator('[data-question-scope]')).toHaveText('这一题 · 整体认读');
  expect(await page.locator('[data-answer]').evaluateAll(buttons => buttons.every(b => b.dataset.answer.startsWith('whole-')))).toBe(true);
  await answerCurrent();
  await page.getByRole('button', {name: '再找一个'}).click();
  await expect(page.locator('[data-question-scope]')).toHaveText('这一题 · 韵母');
  await page.reload();
  await page.getByRole('button', {name: '听音找朋友', exact: true}).click();
  for (const id of ['finals', 'whole']) await expect(page.locator(`[data-quiz-scope="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-quiz-scope="finals"]').click();
  await page.locator('[data-quiz-scope="whole"]').click();
  await expect(page.locator('[data-answer], [data-quiz-listen]')).toHaveCount(0);
  await expect(page.locator('[data-practice-summary]')).toContainText('请选择至少一类');
  await page.reload();
  await page.getByRole('button', {name: '听音找朋友', exact: true}).click();
  await expect(page.locator('[data-answer]')).toHaveCount(0);
  await page.locator('[data-quiz-scope="initials"]').click();
  await expect(page.locator('[data-answer]')).toHaveCount(3);
  expect(await page.locator('[data-answer]').evaluateAll(buttons => buttons.every(b => b.dataset.answer.startsWith('initial-')))).toBe(true);
});

test('every recognition item including independent ong plays on tap', async ({page}) => {
  test.setTimeout(60000);
  await page.goto('/#/pinyin');
  const playEveryItem = async () => {
    const ids = await page.locator('[data-pinyin-item]').evaluateAll(buttons => buttons.map(b => b.dataset.pinyinItem));
    for (const id of ids) {
      const before = await page.evaluate(() => window.__plays.length);
      await page.locator(`[data-pinyin-item="${id}"]`).click();
      await expect.poll(() => page.evaluate(() => window.__plays.length)).toBe(before + 1);
      await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain(`/pinyin/${id}.mp3`);
      await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
    }
  };
  await playEveryItem();
  await page.getByRole('button', {name: '声母与 y w', exact: true}).click();
  await expect(page.locator('[data-pinyin-item]')).toHaveCount(23);
  await expect(page.getByRole('button', {name: '听呼读音', exact: true})).toBeEnabled();
  await playEveryItem();
  await page.getByRole('button', {name: '整体认读', exact: true}).click();
  await expect(page.locator('[data-pinyin-item]')).toHaveCount(16);
  await playEveryItem();
});

test('changing a tone syllable updates all four labels and real audio without autoplay', async ({page}) => {
  test.setTimeout(120000);
  const forms = Object.fromEntries(TONE_BASES.map(base => [base.id, base.forms]));
  await page.goto('/#/pinyin');
  await page.getByRole('button', {name: '听听四声', exact: true}).click();
  await expect(page.locator('[data-tone-base]')).toHaveCount(20);
  for (const [base, symbols] of Object.entries(forms)) {
    const before = await page.evaluate(() => window.__plays.length);
    await page.locator(`[data-tone-base="${base}"]`).click();
    expect(await page.evaluate(() => window.__plays.length)).toBe(before);
    await expect(page.locator('.tone-card strong')).toHaveText(symbols);
    for (let i = 1; i <= 4; i++) {
      const id = `tone-${base}-${i}`;
      await page.locator(`.tone-card[data-pinyin-play="${id}"]`).click();
      await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain(`/pinyin/${id}.mp3`);
      await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
    }
  }
});

test('sequential finals can pause, resume and yield to a manual letter tap', async ({page}) => {
  await page.goto('/#/pinyin');
  await page.getByRole('button', {name: '顺序听', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', {name: '暂停', exact: true}).click();
  expect(await page.evaluate(() => window.__lastAudio.paused)).toBe(true);
  await expect(page.locator('[data-sequence-status]')).toContainText('已暂停');
  await page.getByRole('button', {name: '继续', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.some(src => src.endsWith('/o.mp3')))).toBe(true);
  await page.getByRole('button', {name: '单韵母e', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain('/pinyin/e.mp3');
  await expect(page.getByRole('button', {name: '暂停', exact: true})).toBeDisabled();
  const stoppedCount = await page.evaluate(() => window.__plays.length);
  await page.waitForTimeout(2400);
  expect(await page.evaluate(() => window.__plays.length)).toBe(stoppedCount);
});

test('four-tone sequence plays in order and stops when changing syllables or leaving', async ({page}) => {
  await page.goto('/#/pinyin');
  await page.getByRole('button', {name: '听听四声', exact: true}).click();
  await page.locator('[data-tone-base="ma"]').click();
  await page.getByRole('button', {name: '依次听四声', exact: true}).click();
  await expect(page.locator('[data-sequence-status]')).toContainText('这一轮听完啦', {timeout: 15000});
  expect(await page.evaluate(() => window.__plays.map(src => src.split('/').at(-1)))).toEqual(['tone-ma-1.mp3','tone-ma-2.mp3','tone-ma-3.mp3','tone-ma-4.mp3']);
  await page.getByRole('button', {name: '依次听四声', exact: true}).click();
  await page.locator('[data-tone-base="ai"]').click();
  expect(await page.evaluate(() => window.__lastAudio.paused)).toBe(true);
  await expect(page.getByRole('button', {name: '暂停', exact: true})).toBeDisabled();
  await page.getByRole('button', {name: '依次听四声', exact: true}).click();
  await page.getByRole('button', {name: '整体认读', exact: true}).click();
  expect(await page.evaluate(() => window.__lastAudio.paused)).toBe(true);
});

test('legacy font settings do not alter responsive reading or erase learning records', async ({page}, testInfo) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('reading-garden-v1')) localStorage.setItem('reading-garden-v1', JSON.stringify({largeText: true, progress: {'0009': {page: 6, finished: true, updated: 1}}, words: [{char: '我', bookId: '0087', page: 0}], voice: '', pinyinScopes: ['whole']}));
  });
  const books = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url)));
  test.setTimeout(60000);
  for (const width of [320, 820, 1194, 1440]) {
    await page.setViewportSize({width, height: width === 820 ? 1180 : 900});
    for (const book of books) {
      const longest = book.pages.reduce((best, current, i) => current.text.length > book.pages[best].text.length ? i : best, 0);
      await page.goto(`/#/book/${book.id}/${longest + 1}`);
      await expect(page.locator('.story-text')).toHaveText(book.pages[longest].text);
      const layout = await page.locator('.story-text').evaluate(el => {
        const box = el.getBoundingClientRect(), parent = el.parentElement.getBoundingClientRect(), style = getComputedStyle(el);
        return {font: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight), fits: [...el.children].every(child => { const rect = child.getBoundingClientRect(); return rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.bottom <= box.bottom + 1; }), inside: box.left >= parent.left && box.right <= parent.right};
      });
      expect(layout.font).toBeGreaterThanOrEqual(30);
      expect(layout.font).toBeLessThanOrEqual(38);
      expect(layout.lineHeight / layout.font).toBeGreaterThanOrEqual(1.7);
      expect(layout.fits && layout.inside, `${book.id} at ${width}px: ${JSON.stringify(layout)}`).toBe(true);
      if (testInfo.project.name === 'ipad-chromium' && book.id === '0262') await page.screenshot({path: `test-results/reader-${width}.png`, fullPage: true});
    }
  }
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')));
  expect(saved.progress['0009'].finished).toBe(true);
  expect(saved.words).toEqual([{char: '我', bookId: '0087', page: 0}]);
  expect(saved.pinyinScopes).toEqual(['whole']);
  expect(saved).not.toHaveProperty('largeText');
});

test('long books keep paging labels on one line and every page reachable', async ({page}) => {
  const books = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url)));
  const book = books.reduce((longest, current) => current.pages.length > longest.pages.length ? current : longest);
  for (const width of [320, 620, 621, 820, 1194, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.goto(`/#/book/${book.id}/1`);
    await expect(page.locator('.page-dot')).toHaveCount(book.pages.length);
    for (const selector of ['[data-prev]', '[data-next]']) {
      const lines = await page.locator(selector).evaluate(button => {
        const text = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        const range = document.createRange();
        range.selectNodeContents(text);
        return range.getClientRects().length;
      });
      expect(lines, `${selector} at ${width}px`).toBe(1);
    }
    expect(await page.locator('.page-controls').evaluate(nav => {
      const bounds = nav.getBoundingClientRect();
      return [...nav.children].every(child => {
        const rect = child.getBoundingClientRect();
        return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
      });
    })).toBe(true);
    const alignment = await page.locator('.page-controls').evaluate(nav => {
      const centers = [...nav.querySelectorAll('.page-dot span')].map(dot => {
        const rect = dot.getBoundingClientRect();
        return rect.top + rect.height / 2;
      });
      const button = nav.querySelector('[data-prev]').getBoundingClientRect();
      return {rows: Math.max(...centers) - Math.min(...centers), offset: Math.abs(centers[0] - button.top - button.height / 2)};
    });
    expect(alignment.rows, `single row at ${width}px`).toBeLessThan(1);
    if (width > 620) expect(alignment.offset, `vertically centered at ${width}px`).toBeLessThan(1);
    await expect(page.locator('[data-prev]')).toBeDisabled();
    await page.getByRole('button', {name: `第${book.pages.length}页`, exact: true}).click();
    await expect(page.locator('[data-next]')).toHaveText('读完啦');
    await page.locator('[data-prev]').click();
    await expect(page.locator('.page-dot.current')).toHaveAttribute('data-page', String(book.pages.length - 2));
    await page.locator('[data-next]').click();
    await expect(page.locator('.page-dot.current')).toHaveAttribute('data-page', String(book.pages.length - 1));
    expect(await page.locator('.page-dot.current').evaluate(dot => {
      const rect = dot.getBoundingClientRect(), bounds = dot.parentElement.getBoundingClientRect();
      return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1;
    })).toBe(true);
  }
});

test('iPad rotation, mobile and desktop layouts keep content inside the viewport', async ({page}, testInfo) => {
  for (const size of [{width: 1194, height: 834}, {width: 820, height: 1180}, {width: 390, height: 844}, {width: 320, height: 740}, {width: 1440, height: 900}]) {
    await page.setViewportSize(size);
    for (const path of ['/', '/#/book/0009/4', '/#/pinyin', '/#/parent']) {
      await page.goto(path);
      await expect(page.locator('#main')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      expect(overflow, `${path} at ${size.width}`).toBe(false);
      if (path.includes('parent')) {
        await enterParent(page);
        await expect(page.getByRole('checkbox')).toHaveCount(0);
        const colors = await page.locator('.app-maintenance > summary > span, .sources > summary > span').evaluateAll(titles => titles.map(title => getComputedStyle(title).color));
        expect(colors).toHaveLength(2);
        expect(colors[0]).toBe(colors[1]);
      }
      if (path.includes('pinyin')) {
        for (const tab of ['声母与 y w', '整体认读', '听音找朋友']) {
          await page.getByRole('button', {name: tab, exact: true}).click();
          if (tab === '整体认读') await page.getByRole('button', {name: '整体认读音节yuan', exact: true}).click();
          expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
        }
      }
      if (path.includes('book')) {
        await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        await expect(page.getByRole('button', {name: '切换大字阅读'})).toHaveCount(0);
        const text = await page.locator('.story-text').evaluate(el => ({font: parseFloat(getComputedStyle(el).fontSize), fits: el.scrollWidth <= el.clientWidth + 1}));
        expect(text.font).toBeGreaterThanOrEqual(30);
        expect(text.fits).toBe(true);
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
    await page.getByRole('button', {name: '声母与 y w', exact: true}).click();
    await page.screenshot({path: 'test-results/pinyin-initials-ipad.png', fullPage: true});
    await page.getByRole('button', {name: '整体认读', exact: true}).click();
    await page.getByRole('button', {name: '整体认读音节yuan', exact: true}).click();
    await page.setViewportSize({width: 390, height: 844});
    await page.screenshot({path: 'test-results/pinyin-whole-mobile.png', fullPage: true});
  }
});

test('downloaded library works offline including audio byte ranges at a project subpath', async ({page, context}) => {
  await page.goto('http://localhost:4179/reading-garden/#/parent');
  await enterParent(page);
  await expect(page.getByRole('button', {name: '下载离线故事包'})).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once: true})); });
  await page.getByRole('button', {name: '下载离线故事包'}).click();
  await expect(page.locator('#download-status')).toContainText('已下载全部故事', {timeout: 20000});
  await context.setOffline(true);
  await page.reload();
  await enterParent(page);
  await page.getByRole('link', {name: '故事书架', exact: true}).click();
  await page.goto(new URL('#/library', page.url()).href);
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  await page.locator('.book-card[href^="#/book/0009/"]').click();
  await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', {name: '读这一页'}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain('/reading-garden/assets/books/0009/02.mp3');
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  const range = await page.evaluate(async () => { const r = await fetch('./assets/books/0009/02.mp3', {headers: {Range: 'bytes=0-15'}}); return {status: r.status, bytes: (await r.arrayBuffer()).byteLength, contentRange: r.headers.get('Content-Range')}; });
  expect(range.status).toBe(206); expect(range.bytes).toBe(16); expect(range.contentRange).toMatch(/^bytes 0-15\//);
  await page.goto('http://localhost:4179/reading-garden/#/pinyin');
  await page.getByRole('button', {name: '单韵母o', exact: true}).click();
  await page.getByRole('button', {name: '听读音'}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain('/reading-garden/assets/pinyin/o.mp3');
  // Cached bytes must be the selected CLI files, including at the old stable URLs.
  const cached = await page.evaluate(async () => {
    const {sources} = await fetch('./assets/sources.json').then(r => r.json());
    const results = [];
    for (const source of sources.filter(s => s.kind === 'pinyin')) {
      const response = await fetch(`./${source.assets[0].path}`);
      const bytes = await response.arrayBuffer();
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
      results.push(response.ok && hash === source.original.sha256);
    }
    return results;
  });
  expect(cached).toEqual(Array(143).fill(true));
  await page.getByRole('button', {name: '单韵母a', exact: true}).click();
  await page.getByRole('button', {name: '听读音'}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', {name: '听听四声', exact: true}).click();
  await page.locator('[data-tone-base="ma"]').click();
  await page.getByRole('button', {name: '听第四声mà', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.getByRole('button', {name: '认识韵母', exact: true}).click();
  await page.getByRole('button', {name: '后鼻韵母ong', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain('/pinyin/ong.mp3');
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.goto('http://localhost:4179/reading-garden/#/parent');
  await enterParent(page);
  await expect(page.locator('.sources')).not.toHaveAttribute('open', '');
  await expect(page.locator('.sources').getByRole('link', {name: 'CLI · The Chinese Language Institute', exact: true})).not.toBeVisible();
  await page.locator('.sources > summary').click();
  await expect(page.locator('.sources > summary')).toHaveCount(1);
  await expect(page.locator('.source-platform')).toHaveCount(2);
  await expect(page.locator('.source-book')).toHaveCount(0);
  await expect(page.locator('.sources').getByRole('link', {name: 'CLI · The Chinese Language Institute', exact: true})).toHaveCount(1);
  await expect(page.locator('.sources').getByRole('link', {name: 'Silas · ChinaHelp', exact: true})).toHaveCount(1);
  await expect(page.locator('.sources a[href$="sources.json"]')).toHaveCount(0);
  await expect(page.locator('a[href="undefined"]')).toHaveCount(0);
});

test('storage corruption is recoverable and clearing data requires a deliberate confirmation', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('reading-garden-v1', '{broken'));
  await page.reload();
  await page.goto(new URL('#/library', page.url()).href);
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  await page.goto('/#/book/0156/2');
  await page.goto('/#/parent');
  await enterParent(page);
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
  await expect(page.getByRole('button', {name: '本次先收好（点此移出）'})).toBeEnabled();
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

test('independent ong is attributed separately, packaged and available to finals questions', async ({page}) => {
  await page.goto('/#/pinyin');
  await page.getByRole('button', {name: '后鼻韵母ong', exact: true}).click();
  await expect(page.locator('.sample-sound')).toContainText('ōng');
  await expect(page.locator('.sample-sound')).not.toContainText('hōng');
  await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain('/pinyin/ong.mp3');
  const state = await page.evaluate(async () => {
    const pinyin = await import('./app/pinyin.js');
    const manifest = await fetch('./precache.json').then(r => r.json());
    const {sources} = await fetch('./assets/sources.json').then(r => r.json());
    return {source: pinyin.pinyinAudio('ong'), candidate: pinyin.practicePool('finals').some(item => item.id === 'ong'), packaged: manifest.files.includes('assets/pinyin/ong.mp3'), original: sources.find(s => s.kind === 'pinyin' && s.id === 'ong').original.url};
  });
  expect(state).toEqual({source: 'assets/pinyin/ong.mp3', candidate: true, packaged: true, original: 'https://chinahelp4u.com/wp-content/uploads/2021/10/finial-ong-.mp3'});
});

test('r and ri show and play first-tone examples in both lessons', async ({page}) => {
  await page.goto('/#/pinyin');
  for (const [tab, label, id, button] of [['声母与 y w', '声母r', 'initial-r', '听呼读音'], ['整体认读', '整体认读音节ri', 'whole-ri', '听读音']]) {
    await page.getByRole('button', {name: tab, exact: true}).click();
    await page.getByRole('button', {name: label, exact: true}).click();
    await expect(page.locator('.sample-sound')).toContainText('rī');
    await expect(page.locator('.sample-sound')).toContainText('第一声');
    await expect(page.locator('.lesson-copy')).not.toContainText('第四声');
    await page.getByRole('button', {name: button, exact: true}).click();
    await expect.poll(() => page.evaluate(() => window.__plays.at(-1))).toContain(`/pinyin/${id}.mp3`);
    await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  }
});

test('all recognition pages share compact cards and sequential listening with short gaps', async ({page}) => {
  await page.goto('/#/pinyin');
  for (const [tab, first, second] of [
    ['认识韵母', 'a', 'o'], ['声母与 y w', 'initial-b', 'initial-p'], ['整体认读', 'whole-zhi', 'whole-chi']
  ]) {
    await page.getByRole('button', {name: tab, exact: true}).click();
    const sizes = await page.locator('[data-pinyin-item]').evaluateAll(buttons => buttons.map(b => ({font: getComputedStyle(b).fontSize, height: b.getBoundingClientRect().height})));
    expect(sizes.every(size => size.font === '28px' && size.height >= 58 && size.height <= 64)).toBe(true);
    await page.evaluate(() => { window.__plays = []; window.__playTimes = []; window.__ends = []; });
    await page.getByRole('button', {name: '顺序听', exact: true}).click();
    await expect.poll(() => page.evaluate(() => window.__plays.length)).toBeGreaterThanOrEqual(2);
    expect(await page.evaluate(() => window.__plays.slice(0, 2).map(src => src.split('/').at(-1)))).toEqual([`${first}.mp3`, `${second}.mp3`]);
    const gap = await page.evaluate(() => window.__playTimes[1] - window.__ends[0].time);
    expect(gap).toBeGreaterThanOrEqual(250); expect(gap).toBeLessThan(900);
    await expect(page.locator(`[data-pinyin-item="${second}"]`)).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', {name: '暂停', exact: true}).click();
    await page.getByRole('button', {name: '继续', exact: true}).click();
    await page.getByRole('button', {name: '停止', exact: true}).click();
    expect(await page.evaluate(() => window.__lastAudio.paused)).toBe(true);
  }
  await page.getByRole('button', {name: '听听四声', exact: true}).click();
  await page.evaluate(() => { window.__plays = []; window.__playTimes = []; window.__ends = []; });
  await page.getByRole('button', {name: '依次听四声', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBeGreaterThanOrEqual(2);
  const gap = await page.evaluate(() => window.__playTimes[1] - window.__ends[0].time);
  expect(gap).toBeGreaterThanOrEqual(150); expect(gap).toBeLessThan(800);
});

test('parent entry requires a full hold, cancels on release/movement and guards direct links and reloads', async ({page}) => {
  await page.goto('/#/pinyin');
  await page.getByRole('button', {name: '顺序听', exact: true}).click();
  await page.getByRole('link', {name: '家长小角', exact: true}).click();
  expect(await page.evaluate(() => window.__lastAudio.paused)).toBe(true);
  const gate = page.locator('#parent-dialog');
  const hold = page.getByRole('button', {name: '长按进入', exact: true});
  await expect(gate).toBeVisible();
  await expect(hold).toHaveAccessibleDescription('按住 1 秒');
  await hold.click({delay: 150});
  await page.waitForTimeout(1050);
  await expect(gate).toBeVisible();
  await expect(page.locator('[data-reset]')).toHaveCount(0);
  const box = await hold.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 30, box.y + 10);
  await page.waitForTimeout(1050);
  await page.mouse.up();
  await expect(gate).toBeVisible();
  await gate.getByRole('button', {name: '返回', exact: true}).click();
  await expect(gate).not.toBeVisible();
  await page.goto('/#/parent');
  await expect(gate).toBeVisible();
  expect(page.url()).not.toContain('#/parent');
  await hold.focus();
  await page.keyboard.down('Space');
  await expect(page.getByRole('heading', {name: '陪她读，也给她一点空间。'})).toBeVisible();
  await page.keyboard.up('Space');
  await expect(gate).not.toBeVisible();
  await page.reload();
  await expect(gate).toBeVisible();
  await expect(page.locator('[data-reset]')).toHaveCount(0);
  await enterParent(page);
  await page.getByRole('link', {name: '学拼音', exact: true}).click();
  await page.getByRole('link', {name: '家长小角', exact: true}).click();
  await expect(gate).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(gate).not.toBeVisible();
});


test('a hundred books keep parent sources compact while reader credits stay complete', async ({page}) => {
  await page.route('**/data/books.json', async route => {
    const response = await route.fetch(), books = await response.json();
    await route.fulfill({json: Array.from({length: 100}, (_, i) => ({...books[i % books.length], id: `sample-${i}`}))});
  });
  await page.goto('/#/parent'); await enterParent(page);
  const sources = page.locator('.sources');
  await expect(sources).not.toHaveAttribute('open', '');
  await page.locator('.sources > summary').click();
  await expect(page.locator('.source-platform')).toHaveCount(2);
  await expect(page.locator('.source-book')).toHaveCount(0);
  await expect(sources).toContainText('CC BY 3.0');
  await expect(sources).toContainText('CC BY-NC 3.0');
  await expect(sources).toContainText('署名见各书阅读页');
  await page.locator('.sources > summary').click();
  await expect(page.locator('.sources-body')).not.toBeVisible();
  await page.goto('/#/book/sample-0/1');
  await page.getByText('这本书的作者与来源', {exact: true}).click();
  for (const credit of ['Letta Machoga', 'Wiehan de Jager', 'dohliam', 'Zhuo Sun']) await expect(page.locator('.reader-credit')).toContainText(credit);
  await expect(page.locator('.reader-credit').getByRole('link', {name: 'CC BY 3.0', exact: true})).toBeVisible();
});

test('checking updates bypasses cached manifests and refreshing the page preserves saved learning', async ({page, context, updateHost}) => {
  await page.goto(`${updateHost.url}/#/book/0087/2`);
  await expect(page.locator('.story-text')).toBeVisible();
  await page.goto(`${updateHost.url}/#/parent`); await enterParent(page);
  const before = await page.evaluate(() => localStorage.getItem('reading-garden-v1'));
  await expect(page.locator('.app-maintenance')).not.toHaveAttribute('open', '');
  await expect(page.getByRole('button', {name: '检查更新', exact: true})).not.toBeVisible();
  await expect(page.locator('.app-maintenance [data-app-refetch]')).toHaveCount(0);
  await expect(page.locator('.offline-panel [data-app-refetch]')).toBeVisible();
  await page.locator('.app-maintenance > summary').click();
  await page.getByRole('button', {name: '检查更新', exact: true}).click();
  await expect(page.locator('#app-update-status')).toHaveText('当前已是最新版本。');
  // A server manifest newer than the cached shell must be reported, not hidden by the worker cache.
  updateHost.overrides.set('/precache.json', {body: JSON.stringify({...updateHost.manifest, version: '0123456789abcdef'})});
  await page.getByRole('button', {name: '检查更新', exact: true}).click();
  await expect(page.locator('#app-update-status')).toContainText('新版已准备好');
  updateHost.overrides.delete('/precache.json');
  await page.getByRole('button', {name: '重新加载页面', exact: true}).click();
  await expect(page.locator('#parent-dialog')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('reading-garden-v1'))).toBe(before);
  await enterParent(page);
  await page.locator('.app-maintenance > summary').click();
  await context.setOffline(true);
  await page.getByRole('button', {name: '检查更新', exact: true}).click();
  await expect(page.locator('#app-update-status')).toContainText('当前未联网');
  await page.getByRole('button', {name: '重新加载页面', exact: true}).click();
  await expect(page.locator('#parent-dialog')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('reading-garden-v1'))).toBe(before);
});

test('resource repair replaces damaged cached audio, keeps records and other projects, and remains offline usable', async ({page, context}) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:4179/reading-garden/#/book/0087/2');
  await expect(page.locator('.story-text')).toBeVisible();
  await page.goto('http://localhost:4179/reading-garden/#/parent'); await enterParent(page);
  const before = await page.evaluate(() => localStorage.getItem('reading-garden-v1'));
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once: true}));
    const info = await fetch('./precache.json').then(r => r.json());
    const cache = await caches.open(`reading-garden:/reading-garden/:${info.version}`);
    await cache.put(new URL('./assets/pinyin/ong.mp3', document.baseURI), new Response('damaged', {headers: {'Content-Type': 'audio/mpeg'}}));
    await (await caches.open('abc-garden:sentinel')).put(new URL('/abc-garden/sentinel', location.origin), new Response('keep'));
  });
  await page.getByRole('button', {name: '重新获取资源', exact: true}).click();
  await expect(page.locator('#resource-refresh-status')).toContainText('资源已重新获取并校验', {timeout: 40000});
  const repaired = await page.evaluate(async () => {
    const {sources} = await fetch('./assets/sources.json').then(r => r.json());
    const response = await fetch('./assets/pinyin/ong.mp3');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await response.arrayBuffer())), b => b.toString(16).padStart(2, '0')).join('');
    return {correct: hash === sources.find(s => s.kind === 'pinyin' && s.id === 'ong').original.sha256, temporary: (await caches.keys()).some(name => name.includes('refresh-')), other: await (await (await caches.open('abc-garden:sentinel')).match(new URL('/abc-garden/sentinel', location.origin))).text()};
  });
  expect(repaired).toEqual({correct: true, temporary: false, other: 'keep'});
  expect(await page.evaluate(() => localStorage.getItem('reading-garden-v1'))).toBe(before);
  await context.setOffline(true);
  await page.getByRole('button', {name: '重新获取资源', exact: true}).click();
  await expect(page.locator('#resource-refresh-status')).toContainText('当前未联网');
  await page.goto('http://localhost:4179/reading-garden/#/pinyin');
  await page.getByRole('button', {name: '后鼻韵母ong', exact: true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
});

test('a failed or invalid refetch leaves existing offline content intact and re-enables actions', async ({page, updateHost}) => {
  test.setTimeout(60000);
  await page.goto(`${updateHost.url}/#/parent`); await enterParent(page);
  await page.getByRole('button', {name: '下载离线故事包', exact: true}).click();
  await expect(page.locator('#download-status')).toContainText('已下载全部故事', {timeout: 40000});
  const cachedAudio = () => page.evaluate(async () => {
    const info = await fetch('./precache.json').then(r => r.json());
    const cache = await caches.open(`reading-garden:/:${info.version}`);
    return Array.from(new Uint8Array(await (await cache.match(new URL('./assets/pinyin/ong.mp3', document.baseURI))).arrayBuffer())).join(',');
  });
  const original = await cachedAudio();
  updateHost.overrides.set('/assets/pinyin/ong.mp3', {status: 200, body: 'bad replacement'});
  await page.getByRole('button', {name: '重新获取资源', exact: true}).click();
  await expect(page.locator('#resource-refresh-status')).toContainText('校验失败', {timeout: 40000});
  expect(await cachedAudio()).toBe(original);
  await expect(page.getByRole('button', {name: '重新获取资源', exact: true})).toBeEnabled();
  updateHost.overrides.delete('/assets/pinyin/ong.mp3');
  updateHost.overrides.set('/assets/pinyin/ong.mp3', {status: 503, body: 'unavailable'});
  await page.getByRole('button', {name: '重新获取资源', exact: true}).click();
  await expect(page.locator('#resource-refresh-status')).toContainText('未能重新获取', {timeout: 40000});
  expect(await cachedAudio()).toBe(original);
  expect(await page.evaluate(async () => (await caches.keys()).some(name => name.includes('refresh-')))).toBe(false);
});


test('production updates wait for explicit reload, reuse unchanged media, and then activate the new page', async ({page, context, updateHost}) => {
  test.setTimeout(60000);
  const base = `${updateHost.url}/?offline-test=1`, oldVersion = updateHost.manifest.version, nextVersion = 'fedcba9876543210';
  await page.goto(`${base}#/book/0087/2`);
  await expect(page.locator('.story-text')).toBeVisible();
  await page.getByRole('link', {name: '回到书架', exact: true}).click();
  await page.getByRole('link', {name: '家长小角', exact: true}).click(); await enterParent(page);
  await page.getByRole('button', {name: '下载离线故事包', exact: true}).click();
  await expect(page.locator('#download-status')).toContainText('已下载全部故事', {timeout: 40000});
  const before = await page.evaluate(() => localStorage.getItem('reading-garden-v1'));
  const worker = await readFile(new URL('../../dist/sw.js', import.meta.url), 'utf8');
  const main = await readFile(new URL('../../dist/app/main.js', import.meta.url), 'utf8');
  expect(worker).toContain(oldVersion);
  expect(main).toContain('听听声音，动动小嘴巴。');
  const networkStart = updateHost.requests.length;
  updateHost.overrides.set('/sw.js', {body: worker.replace(oldVersion, nextVersion)});
  updateHost.overrides.set('/precache.json', {body: JSON.stringify({...updateHost.manifest, version: nextVersion})});
  updateHost.overrides.set('/app/main.js', {body: main.replace('听听声音，动动小嘴巴。', '新版拼音小课堂')});
  await page.locator('.app-maintenance > summary').click();
  await page.getByRole('button', {name: '检查更新', exact: true}).click();
  await expect(page.locator('#app-update-status')).toContainText('新版已准备好');
  const pending = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const manifest = await fetch('./precache.json').then(r => r.json());
    return {waiting: !!registration.waiting, version: manifest.version, caches: await caches.keys()};
  });
  expect(pending.waiting).toBe(true);
  expect(pending.version).toBe(oldVersion);
  expect(pending.caches).toContain(`reading-garden:/:${oldVersion}`);
  expect(updateHost.requests.slice(networkStart).filter(path => /^\/assets\/(?:books|pinyin)\//.test(path))).toEqual([]);
  expect(await page.evaluate(async version => !!await (await caches.open(`reading-garden:/:${version}`)).match(new URL('./assets/books/0262/17.mp3', document.baseURI)), nextVersion)).toBe(true);
  await page.getByRole('button', {name: '重新获取资源', exact: true}).click();
  await expect(page.locator('#resource-refresh-status')).toContainText('有新版待启用');
  expect(await page.evaluate(() => localStorage.getItem('reading-garden-v1'))).toBe(before);
  await page.getByRole('link', {name: '学拼音', exact: true}).click();
  await expect(page.getByRole('heading', {name: '听听声音，动动小嘴巴。', exact: true})).toBeVisible();
  await page.getByRole('link', {name: '家长小角', exact: true}).click(); await enterParent(page);
  await page.locator('.app-maintenance > summary').click();
  await page.getByRole('button', {name: '重新加载页面', exact: true}).click();
  await expect(page.locator('#parent-dialog')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('reading-garden-v1'))).toBe(before);
  await page.locator('#parent-dialog').getByRole('button', {name: '返回', exact: true}).click();
  await page.getByRole('link', {name: '学拼音', exact: true}).click();
  await expect(page.getByRole('heading', {name: '新版拼音小课堂', exact: true})).toBeVisible();
  const activated = await page.evaluate(async () => ({version: (await fetch('./precache.json').then(r => r.json())).version, caches: await caches.keys(), waiting: !!(await navigator.serviceWorker.getRegistration()).waiting}));
  expect(activated.version).toBe(nextVersion);
  expect(activated.waiting).toBe(false);
  expect(activated.caches).not.toContain(`reading-garden:/:${oldVersion}`);
  expect(activated.caches).toContain(`reading-garden:/:${nextVersion}`);
  await context.setOffline(true);
  await page.goto(`${base}#/book/0262/16`);
  await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', {name:'读这一页',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
});

test('a queued close event cannot cancel a newly opened parent hold', async ({page}) => {
  await page.goto('/#/pinyin');
  await page.getByRole('link', {name: '家长小角', exact: true}).click();
  await expect(page.locator('#parent-dialog')).toBeVisible();
  await page.evaluate(() => {
    document.querySelector('[data-cancel-parent]').click();
    document.querySelector('.parent-link').click();
    const button = document.querySelector('#parent-hold');
    button.focus();
    button.dispatchEvent(new KeyboardEvent('keydown', {key: ' ', bubbles: true}));
  });
  await expect(page.getByRole('heading', {name: '陪她读，也给她一点空间。'})).toBeVisible();
});

test('all forty books can be found by grade and theme, including empty intersections', async ({page}) => {
  await page.goto('/');
  await page.goto(new URL('#/library', page.url()).href);
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  for (const [grade,count] of [[1,15],[2,11],[3,8],[4,4],[5,2]]) {
    await page.locator(`[data-book-level="Storybooks Canada:${grade}"]`).click();
    await expect(page.locator('.book-card')).toHaveCount(count);
    expect(await page.locator('.book-level').allTextContents()).toEqual(Array(count).fill(`Storybooks Canada ${grade}级`));
  }
  await page.locator('#book-theme').selectOption('动物朋友');
  await expect(page.locator('.book-card')).toHaveCount(0);
  await expect(page.getByText('这个范围暂时没有故事，换一个级别或主题看看吧。')).toBeVisible();
  await page.locator('#book-theme').selectOption('全部故事');
  await page.locator('.book-card').first().click();
  await expect(page.getByRole('heading',{name:'辛波薇亚',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'读这一页',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await page.getByText('这本书的作者与来源',{exact:true}).click();
  await expect(page.locator('.reader-credit')).toContainText('Vicky Liu');
});

test('individual book and grade downloads stay scoped and work offline at a project subpath', async ({page,context}) => {
  test.setTimeout(60000);
  const base = 'http://localhost:4179/reading-garden/';
  await page.goto(`${base}#/parent`); await enterParent(page);
  await page.locator('#download-scope').selectOption('book:0262');
  await expect(page.locator('#download-status')).toContainText('所选资源约');
  await page.getByRole('button',{name:'下载离线故事包',exact:true}).click();
  await expect(page.locator('#download-status')).toContainText('已下载《玛格威》',{timeout:30000});
  const downloaded = () => page.evaluate(async () => {
    const info = await fetch('./precache.json').then(r => r.json());
    const cache = await caches.open(`reading-garden:/reading-garden/:${info.version}`);
    const paths = (await cache.keys()).map(request => new URL(request.url).pathname);
    return {covers:paths.filter(path => /\/books\/\d+\/01.jpg$/.test(path)).length, audio:paths.filter(path => /\/books\/\d+\/\d+.mp3$/.test(path)), pinyin:paths.filter(path => path.includes('/assets/pinyin/')).length};
  });
  const first = await downloaded(); expect(first.covers).toBe(40); expect(first.audio).toHaveLength(16); expect(first.pinyin).toBe(0);
  expect(first.audio.every(path => path.includes('/0262/'))).toBe(true);
  await page.locator('#download-scope').selectOption('level:Storybooks Canada:2');
  await page.getByRole('button',{name:'下载离线故事包',exact:true}).click();
  await expect(page.locator('#download-status')).toContainText('已下载Storybooks Canada · 2级故事',{timeout:30000});
  const second = await downloaded(); expect(second.audio).toHaveLength(16+117); expect(second.pinyin).toBe(0);
  await context.setOffline(true);
  for (const [id,number] of [['0262',16],['0337',11]]) {
    await page.goto(`${base}#/book/${id}/${number}`);
    await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.getByRole('button',{name:'读这一页',exact:true}).click();
    await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  }
});

test('reader downloads only that book and reports it without losing progress', async ({page,context}) => {
  await page.goto('/#/book/0315/3');
  await page.getByRole('button',{name:'下载这本书',exact:true}).click();
  await expect(page.locator('#book-download-status')).toContainText('已下载《萨可满的歌声》',{timeout:20000});
  await context.setOffline(true); await page.goto('/#/book/0315/18');
  await expect(page.locator('.story-text')).toBeVisible();
  await expect.poll(() => page.locator('.page-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button',{name:'读这一页',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
});

test('an update refuses corrupted old media and omits withdrawn assets while reusing a selected book', async ({page,context,updateHost}) => {
  test.setTimeout(60000);
  const base = `${updateHost.url}/?offline-test=1`, nextVersion = '0123456789abcdef';
  await page.goto(`${base}#/parent`); await enterParent(page);
  await page.locator('#download-scope').selectOption('book:0262');
  await page.getByRole('button',{name:'下载离线故事包',exact:true}).click();
  await expect(page.locator('#download-status')).toContainText('已下载《玛格威》');
  await page.evaluate(async () => {
    const info = await fetch('./precache.json').then(r => r.json());
    const cache = await caches.open(`reading-garden:/:${info.version}`);
    await cache.put(new URL('./assets/books/0262/02.mp3',document.baseURI),new Response('damaged'));
    await cache.put(new URL('./assets/books/withdrawn.mp3',document.baseURI),new Response('withdrawn'));
  });
  const worker = await readFile(new URL('../../dist/sw.js',import.meta.url),'utf8');
  updateHost.overrides.set('/sw.js',{body:worker.replace(updateHost.manifest.version,nextVersion)});
  updateHost.overrides.set('/precache.json',{body:JSON.stringify({...updateHost.manifest,version:nextVersion})});
  await page.locator('.app-maintenance > summary').click();
  await page.getByRole('button',{name:'检查更新',exact:true}).click();
  await expect(page.locator('#app-update-status')).toContainText('新版已准备好',{timeout:30000});
  const migrated = await page.evaluate(async version => {
    const cache = await caches.open(`reading-garden:/:${version}`);
    const has = async path => !!await cache.match(new URL(path,document.baseURI));
    return {good:await has('./assets/books/0262/17.mp3'),bad:await has('./assets/books/0262/02.mp3'),withdrawn:await has('./assets/books/withdrawn.mp3'),unselected:await has('./assets/books/0052/02.mp3')};
  },nextVersion);
  expect(migrated).toEqual({good:true,bad:false,withdrawn:false,unselected:false});
  await page.getByRole('button',{name:'重新加载页面',exact:true}).click();
  await expect(page.locator('#parent-dialog')).toBeVisible();
  await page.locator('#parent-dialog').getByRole('button',{name:'返回',exact:true}).click();
  await page.goto(`${base}#/book/0262/1`);
  await page.getByRole('button',{name:'读这一页',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
  await context.setOffline(true);await page.goto(`${base}#/book/0262/16`);
  await page.getByRole('button',{name:'读这一页',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
});

test('a failed worker installation discards its partial copy and preserves the old offline book', async ({page,context,updateHost}) => {
  test.setTimeout(60000);
  const base = `${updateHost.url}/?offline-test=1`, nextVersion = 'aaaabbbbccccdddd';
  await page.goto(`${base}#/parent`);await enterParent(page);
  await page.locator('#download-scope').selectOption('book:0262');
  await page.getByRole('button',{name:'下载离线故事包',exact:true}).click();
  await expect(page.locator('#download-status')).toContainText('已下载《玛格威》');
  const worker = await readFile(new URL('../../dist/sw.js',import.meta.url),'utf8');
  const broken = worker.replace(updateHost.manifest.version,nextVersion).replace("await cache.put(url('precache.json'), response);", "await cache.put(url('precache.json'), response); throw Error('simulated install failure');");
  expect(broken).toContain('simulated install failure');
  updateHost.overrides.set('/sw.js',{body:broken});
  updateHost.overrides.set('/precache.json',{body:JSON.stringify({...updateHost.manifest,version:nextVersion})});
  await page.locator('.app-maintenance > summary').click();
  await page.getByRole('button',{name:'检查更新',exact:true}).click();
  await expect(page.locator('#app-update-status')).toContainText('新版暂时没有准备好');
  const keys = await page.evaluate(async () => caches.keys());
  expect(keys).not.toContain(`reading-garden:/:${nextVersion}`);
  expect(keys).toContain(`reading-garden:/:${updateHost.manifest.version}`);
  await context.setOffline(true);await page.goto(`${base}#/book/0262/16`);
  await page.getByRole('button',{name:'读这一页',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.__lastAudio.currentTime)).toBeGreaterThan(0);
});

test('character audio leads both dialogs and collection can be removed and restored in place', async ({page},testInfo) => {
  await page.addInitScript(() => {
    window.__spoken=[];
    window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
    Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{name:'Test Mandarin',voiceURI:'test-mandarin',lang:'zh-CN'}],cancel(){},speak(utterance){window.__spoken.push(utterance.text);},addEventListener(){}}});
  });
  await page.goto('/#/book/0087/2');
  await page.getByRole('button',{name:'认识念',exact:true}).click();
  const dialog=page.locator('#word-dialog');
  await expect(dialog.locator('.word-actions .primary')).toHaveText('听字音');
  await dialog.getByRole('button',{name:'听“念”的读音',exact:true}).click();
  expect(await page.evaluate(()=>window.__spoken)).toEqual(['念']);
  await dialog.getByRole('button',{name:'听这一句',exact:true}).click();
  expect(await page.evaluate(()=>window.__spoken)).toEqual(['念','我可以念给谁听呢？']);
  await dialog.getByRole('button',{name:'放进生字篮',exact:true}).click();
  await expect(dialog.getByRole('button',{name:'移出生字篮',exact:true})).toHaveAttribute('aria-pressed','true');
  await dialog.getByRole('button',{name:'移出生字篮',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('reading-garden-v1')).words.length)).toBe(0);
  await dialog.getByRole('button',{name:'放进生字篮',exact:true}).click();
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();
  await page.goto('/#/words');
  await page.getByRole('button',{name:'复习念',exact:true}).click();
  await dialog.getByRole('button',{name:'听“念”的读音',exact:true}).click();
  expect(await page.evaluate(()=>window.__spoken)).toEqual(['念','我可以念给谁听呢？','念']);
  await dialog.getByRole('button',{name:'移出生字篮',exact:true}).click();
  await expect(dialog).toBeVisible();
  await expect(page.locator('.saved-word')).toHaveCount(0);
  await expect(page.locator('.nav-item .count')).toHaveCount(0);
  await dialog.getByRole('button',{name:'放进生字篮',exact:true}).click();
  await expect(page.locator('.saved-word')).toHaveCount(1);
  await expect(page.locator('.nav-item .count')).toHaveText('1');
  if(testInfo.project.name==='ipad-chromium'){
    await page.screenshot({path:'test-results/word-dialog-ipad.png'});
    await page.setViewportSize({width:390,height:844});
    await expect(dialog.locator('[data-word-listen]')).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:'test-results/word-dialog-phone.png'});
  }
  await dialog.getByRole('button',{name:'关闭',exact:true}).click();
  await page.reload();
  await expect(page.locator('.saved-word')).toHaveCount(1);
});

test('reading help appears on the first read only across page changes, reloads and books',async({page})=>{
  await page.goto('/#/book/0087/1');
  await expect(page.locator('.reading-hint')).toBeVisible();
  await page.getByRole('button',{name:'下一页',exact:true}).click();
  await expect(page.locator('.reading-hint')).toHaveCount(0);
  await page.getByRole('button',{name:'上一页',exact:true}).click();
  await expect(page.locator('.reading-hint')).toHaveCount(0);
  await page.reload();await expect(page.locator('.story-text')).toBeVisible();
  await expect(page.locator('.reading-hint')).toHaveCount(0);
  await page.goto('/#/book/0009/1');
  await expect(page.locator('.reading-hint')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('reading-garden-v1')).readingHelpSeen)).toBe(true);
});

test('character listening without a Chinese device voice falls back to the recorded sentence',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(speechSynthesis,'getVoices',{value:()=>[]}));
  await page.goto('/#/book/0087/2');
  await page.getByRole('button',{name:'认识念',exact:true}).click();
  await page.getByRole('button',{name:'听“念”的读音',exact:true}).click();
  await expect(page.locator('#status')).toContainText('先听故事原句');
  await expect.poll(()=>page.evaluate(()=>window.__plays.at(-1))).toContain('/assets/books/0087/03.mp3');
  await expect.poll(()=>page.evaluate(()=>window.__lastAudio.currentTime)).toBeGreaterThan(0);
});
