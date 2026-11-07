import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const books = JSON.parse(await readFile(new URL('../../data/books.json', import.meta.url)));
const readState = page => page.evaluate(() => JSON.parse(localStorage.getItem('reading-garden-v1')));
const pickIds = async page => {
  await expect(page.locator('.reading-shelf')).toBeVisible();
  return page.locator('.reading-picks > .reading-pick > a').evaluateAll(links => links.map(link => link.getAttribute('href').split('/')[2]));
};
const add = (page, id) => page.locator(`.library-book [data-reading-add="${id}"]`);
const seed = async (page, readingList) => page.addInitScript(({readingList}) => {
  if (!localStorage.getItem('reading-garden-v1')) localStorage.setItem('reading-garden-v1', JSON.stringify({readingList, readingHelpSeen: false, progress: {'0087': {page: 2, updated: 1, finished: true, rereading: true}}, words: [{char: '我', bookId: '0087', page: 0}], voice: 'Mandarin', pinyinScopes: ['whole']}));
}, {readingList});

test('shelf and catalog are separate; choosing several books stays in the catalog and survives reload', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.reading-shelf-empty')).toBeVisible();
  await expect(page.locator('.book-card, [data-book-level], [data-edit-reading-list]')).toHaveCount(0);
  await page.getByRole('link', {name: '去书库挑一挑', exact: true}).click();
  await expect(page).toHaveURL(/#\/library$/);
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  await expect(page.locator('.reading-shelf')).toHaveCount(0);
  for (const id of ['0156', '0087', '0009']) {
    await add(page, id).click();
    await expect(page.locator(`[data-book-id="${id}"] button`)).toBeFocused();
    await expect(page).toHaveURL(/#\/library$/);
  }
  await expect(page.locator('.library-toolbar')).toContainText('3 / 6 本');
  await page.locator('.library-toolbar a').click();
  expect(await pickIds(page)).toEqual(['0156', '0087', '0009']);
  await expect(page.locator('[data-reading-remove]')).toHaveCount(3);
  await page.reload();
  expect(await pickIds(page)).toEqual(['0156', '0087', '0009']);
});

test('shared cards toggle membership in the catalog; removal and re-adding preserve learning records', async ({page}) => {
  const ids = ['0156', '0087', '0009'];
  await seed(page, ids); await page.goto('/');
  const before = await readState(page);
  const shelfInfo = await page.locator('[data-book-id="0087"] .pick-info').innerHTML();
  const shelfButton = await page.locator('[data-reading-remove="0087"]').evaluate(el => el.outerHTML);
  await page.getByRole('link', {name: '去书库选书', exact: true}).click();
  expect(await page.locator('[data-book-id="0087"] .pick-info').innerHTML()).toBe(shelfInfo);
  expect(await page.locator('[data-reading-remove="0087"]').evaluate(el => el.outerHTML)).toBe(shelfButton);
  await page.locator('[data-reading-remove="0087"]').click();
  await expect(add(page, '0087')).toBeFocused();
  await expect(add(page, '0087')).toHaveAccessibleName('把《我喜欢看书》放到小书架');
  await add(page, '0087').click();
  await expect(page.locator('[data-reading-remove="0087"]')).toBeFocused();
  await page.locator('.library-toolbar a').click();
  expect(await pickIds(page)).toEqual(['0156', '0009', '0087']);
  const after = await readState(page);
  expect(after.progress).toEqual(before.progress); expect(after.words).toEqual(before.words);
  expect(after.voice).toBe(before.voice); expect(after.pinyinScopes).toEqual(before.pinyinScopes);
  for (const id of ids) await page.locator(`[data-reading-remove="${id}"]`).click();
  await expect(page.locator('.reading-shelf-empty')).toBeVisible();
  await expect(page.locator('.reading-shelf-actions a')).toBeFocused();
  await expect(page.locator('[data-reading-undo], .shelf-undo')).toHaveCount(0);
  await page.reload();
  expect((await readState(page)).readingList).toEqual([]);
});

test('six-book limit allows replacement directly in the catalog without duplicates', async ({page}) => {
  const ids = books.slice(0, 7).map(book => book.id);
  await seed(page, ids.slice(0, 6)); await page.goto('/#/library');
  await add(page, ids[6]).click();
  await expect(page.locator('#status')).toContainText('已经有 6 本');
  await page.locator(`[data-reading-remove="${ids[1]}"]`).click();
  await add(page, ids[6]).click();
  expect((await readState(page)).readingList).toEqual([...ids.slice(0,6).filter(id=>id!==ids[1]),ids[6]]);
  await page.reload();
  expect(new Set((await readState(page)).readingList).size).toBe(6);
});

test('catalog reading, grade and theme filters work independently from the shelf', async ({page}) => {
  await page.goto('/#/library');
  await page.getByRole('button', {name: '阅读中', exact: true}).click();
  await expect(page.locator('.book-card')).toHaveCount(0);
  for (const id of ['0087', '0156', '0009']) { await page.goto(`/#/book/${id}/2`); await expect(page.locator('.story-text')).toBeVisible(); }
  await page.goto('/#/library');
  await expect(page.locator('.book-card')).toHaveCount(3);
  await page.locator('[data-book-level="Storybooks Canada:5"]').click();
  await expect(page.locator('.book-card')).toHaveCount(0);
  await page.getByRole('button', {name: '全部故事', exact: true}).click();
  await expect(page.locator('.book-card')).toHaveCount(2);
  await page.locator('#book-theme').selectOption('动物朋友');
  await expect(page.locator('.book-card')).toHaveCount(0);
  await page.locator('.library-toolbar a').click();
  await expect(page.locator('.reading-shelf-empty')).toBeVisible();
  await expect(page.locator('.hero-caption')).toContainText('我的小猫猫在哪儿？');
  await expect(page.locator('.hero .primary')).toHaveAttribute('href', '#/book/0009/2');
});

test('desktop, iPad and phone keep shared cards and the spacious resume panel usable', async ({page}, testInfo) => {
  const ids = ['0087', '0156', '0009', ...books.filter(book => !['0087','0156','0009'].includes(book.id)).sort((a,b) => b.title.length-a.title.length).slice(0,3).map(book=>book.id)];
  await seed(page, ids); await page.goto('/');
  for (const [name,width,height] of [['pc',1440,1000],['ipad-landscape',1194,834],['tablet-landscape',1024,768],['ipad-portrait',820,1180],['tablet-portrait',768,1024],['phone',390,844],['small-phone',320,740]]) {
    await page.setViewportSize({width,height});
    expect(await page.locator('.reading-picks').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(width<=620?2:3);
    await expect(page.locator('[data-reading-remove]')).toHaveCount(6);
    for (const route of ['shelf','library']) {
      await page.goto(`/#/${route}`);
      await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const targets=await page.locator('.reading-shelf .button, [data-reading-remove], .library-toolbar a, .reading-list-button').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
      expect(targets.every(h=>h>=44),`${name} ${route}`).toBe(true);
      if(route==='shelf') {
        await expect(page.locator('.hero')).toBeVisible();
        await expect(page.locator('#hero-title')).toHaveText('小小的书，大大的世界✳');
        await expect(page.locator('.floating-label')).toHaveText('每一页，都有新发现');
        await expect(page.locator('.hero-art img')).toBeVisible();
        await expect(page.locator('.hero-caption')).toContainText('我喜欢看书');
      }
      const columns = await page.locator(route==='shelf'?'.reading-picks':'.book-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(columns).toBe(width<=620?2:3);
      await expect.poll(()=>page.locator(route==='shelf'?'.reading-pick img':'.book-cover img').first().evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
      if (['pc','ipad-portrait','phone'].includes(name)) await page.screenshot({path:`test-results/separate-${route}-${testInfo.project.name}-${name}.png`});
    }
    await page.goto('/#/shelf');
  }
});

test('catalog membership toggles and persists offline at a project subpath', async ({page,context}) => {
  const url='http://localhost:4179/reading-garden/';
  await page.goto(`${url}#/library`);
  await expect(page.locator('.book-card')).toHaveCount(books.length);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
  await context.setOffline(true); await page.reload();
  await add(page,'0087').click(); await page.locator('.library-toolbar a').click();
  await page.locator('[data-reading-remove="0087"]').click();
  await page.getByRole('link',{name:'去书库选书',exact:true}).click();
  await add(page,'0087').click(); await page.locator('.library-toolbar a').click(); await page.reload();
  expect(await pickIds(page)).toEqual(['0087']);
  await expect.poll(()=>page.locator('.reading-pick img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
});


test('phone footers keep reading and membership controls on one row and preserve reading behavior', async ({page}) => {
  await seed(page, ['0087', '0156', '0110']);
  await page.goto('/#/book/0087/8');
  await page.getByRole('button', {name: '读完啦', exact: true}).click();
  await expect(page.getByRole('heading', {name: '又认识了一个小世界。', exact: true})).toBeVisible();
  await page.goto('/#/shelf');
  for (const width of [320, 390, 620]) {
    await page.setViewportSize({width, height: 844});
    for (const section of ['shelf', 'library']) {
      await page.goto(`/#/${section}`);
      const checks = await page.locator('.card-actions').evaluateAll(rows => rows.map(row => {
        const read = row.querySelector('a').getBoundingClientRect(), button = row.querySelector('button').getBoundingClientRect(), bounds = row.getBoundingClientRect();
        return Math.abs(read.top - button.top) < 1 && read.right <= button.left && button.right <= bounds.right && read.width >= 44 && button.width >= 44 && read.height >= 44 && button.height >= 44;
      }));
      expect(checks.every(Boolean), `${width} ${section}`).toBe(true);
      expect(await page.locator('[data-book-id="0156"] .pick-info p').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12);
      await expect(page.locator('[data-book-id="0087"] .pick-info p')).toHaveCount(0);
      await expect(page.locator('[data-book-id="0087"] .card-actions a')).toHaveText('再读一遍');
      await expect(page.locator('[data-book-id="0156"] .pick-info .mobile-label')).toHaveText('还没读');
    }
  }
  await page.goto('/#/shelf');
  await page.locator('[data-book-id="0087"] .card-actions a').click();
  await expect(page).toHaveURL(/#\/book\/0087\/1$/);
  await page.getByRole('button', {name: '下一页', exact: true}).click();
  await page.getByRole('link', {name: '回到书架', exact: true}).click();
  await expect(page.locator('[data-book-id="0087"] .pick-info .mobile-label')).toHaveText('第 2 / 8 页');
  await page.locator('[data-reading-remove="0087"]').click();
  expect((await readState(page)).readingList).toEqual(['0156', '0110']);
  expect((await readState(page)).progress['0087'].page).toBe(1);
});

test('source badges wrap naturally without separating a grade or clipping either shared card view', async ({page}, testInfo) => {
  await seed(page, ['0087','sw-92448','0052']);
  for (const width of [320,375,390,620,768,820,1024,1194,1440]) {
    await page.setViewportSize({width,height:1000});
    for (const section of ['shelf','library']) {
      await page.goto(`/#/${section}`);
      await expect(page.locator('.book-level-grade').first()).toHaveText('1级');
      const labels = await page.locator('.reading-pick .book-level').evaluateAll(els => els.map(el => {
        const box=el.getBoundingClientRect(), parent=el.parentElement.getBoundingClientRect(), grade=el.querySelector('.book-level-grade');
        const rect=grade.getBoundingClientRect(), style=getComputedStyle(el);
        return {text:grade.textContent,onePiece:grade.getClientRects().length===1,
          inside:box.left>=parent.left && box.right<=parent.right+1 && rect.right<=box.right+1 && rect.bottom<=box.bottom+1,
          readable:parseFloat(style.fontSize)>=11,
          atMostTwoLines:box.height<=2*parseFloat(style.lineHeight)+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+1};
      }));
      expect(labels.every(label=>/^\d级$/.test(label.text)&&label.onePiece&&label.inside&&label.readable&&label.atMostTwoLines), `${width}px ${section}: ${JSON.stringify(labels)}`).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width===390) await page.locator(section==='shelf'?'.reading-picks':'.book-grid').screenshot({path:testInfo.outputPath(`badges-${section}.png`)});
    }
  }
});
