import {test,expect} from '@playwright/test';

test('feedback works offline under a subpath, and leaving cancels the delayed answer',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  Math.random=()=>0;window.plays=[];
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){window.plays.push(this.src);return play.apply(this,args);};
 });
 await page.goto('http://localhost:4179/reading-garden/#/pinyin');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await page.evaluate(async()=>{const {downloadLibrary}=await import('./app/offline.js');await downloadLibrary(()=>{},'pinyin');});
 await context.setOffline(true);await page.reload();
 await page.getByRole('button',{name:'听音找朋友',exact:true}).click();
 const answer=await page.evaluate(async()=>{const p=await import('./app/pinyin.js');return p.practicePool('finals')[0].id;});
 const wrong=page.locator(`[data-answer]:not([data-answer="${answer}"])`).first();
 await wrong.click();const effect=page.locator('#feedback-audio');
 await expect.poll(()=>effect.evaluate(a=>a.currentTime)).toBeGreaterThan(.04);
 expect(await effect.evaluate(a=>a.src)).toContain('/reading-garden/assets/audio/feedback-retry.wav');
 expect(await effect.evaluate(a=>a.volume)).toBe(1);
 // Pronunciation follows B2 only after it ends; it must not cover the cue.
 await expect.poll(()=>page.evaluate(()=>window.plays.at(-1))).toContain(`/pinyin/${answer}.mp3`);
 expect(await effect.evaluate(a=>a.paused)).toBe(true);
 await page.locator(`[data-answer="${answer}"]`).click();
 await expect.poll(()=>effect.evaluate(a=>a.currentTime)).toBeGreaterThan(.04);
 expect(await effect.evaluate(a=>a.src)).toContain('/feedback-correct.wav');
 await page.getByRole('button',{name:'再找一个',exact:true}).click();
 expect(await effect.evaluate(a=>a.paused)).toBe(true);
 const nextAnswer=await page.evaluate(async()=>{const p=await import('./app/pinyin.js');return p.practicePool('finals')[0].id;});
 await page.locator(`[data-answer]:not([data-answer="${nextAnswer}"])`).first().click();
 await expect.poll(()=>effect.evaluate(a=>a.currentTime)).toBeGreaterThan(.04);
 await page.getByRole('button',{name:'认识韵母',exact:true}).click();
 expect(await effect.evaluate(a=>a.paused)).toBe(true);
 const count=await page.evaluate(()=>window.plays.length);
 await page.waitForTimeout(2300);
 expect(await page.evaluate(()=>window.plays.length)).toBe(count);
 expect(errors).toEqual([]);
});
