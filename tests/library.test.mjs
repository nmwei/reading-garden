import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {selectLibrary, mapLimited, verifyAsset} from '../app/library.js';

const info = {files: ['app.js', 'a.jpg', 'a.mp3', 'b.jpg', 'b.mp3', 'pinyin.mp3'], bytes: 41, pinyin: {files:['pinyin.mp3'],bytes:3}, books: {
  a: {title:'甲',level:1,files:['a.jpg','a.mp3'],bytes:12}, b: {title:'乙',level:2,files:['b.jpg','b.mp3'],bytes:20}
}};
test('book and level downloads exclude other stories and pinyin, while all retains app files', () => {
  assert.deepEqual(selectLibrary(info, 'book:a'), {label:'《甲》',files:['a.jpg','a.mp3'],bytes:12});
  assert.deepEqual(selectLibrary(info, 'level:2'), {label:'2级故事',files:['b.jpg','b.mp3'],bytes:20});
  assert.deepEqual(selectLibrary(info, 'pinyin'), {label:'拼音读音',files:['pinyin.mp3'],bytes:3});
  assert.deepEqual(selectLibrary(info).files, info.files);
  assert.throws(() => selectLibrary(info, 'book:missing'), /有效/);
  assert.throws(() => selectLibrary(info, 'level:0'), /有效/);
});
test('parallel downloads remain bounded and drain in-flight writes before a failure escapes', async () => {
  let running = 0, peak = 0;
  const completed = [];
  await mapLimited([1,2,3,4,5,6], async item => {
    running++; peak = Math.max(peak,running);
    await new Promise(resolve => setTimeout(resolve, 3)); completed.push(item); running--;
  }, 2);
  assert.equal(peak, 2); assert.deepEqual(completed.sort(), [1,2,3,4,5,6]);
  const writes = [];
  await assert.rejects(mapLimited([0,1,2,3], async item => {
    if (item === 0) { await new Promise(resolve => setTimeout(resolve, 2)); throw Error('network'); }
    await new Promise(resolve => setTimeout(resolve, 15)); writes.push(item);
  }, 2), /network/);
  assert.deepEqual(writes, [1]);
});
test('same-number source levels have independent offline groups, including silent books', () => {
  const mixed = {...info, books:{
    b:{...info.books.b,levelKey:'Storybooks Canada:2',levelLabel:'Storybooks Canada · 2级'},
    c:{title:'绘画',level:2,levelKey:'StoryWeaver:2',levelLabel:'StoryWeaver · 2级',files:['c.jpg'],bytes:4}
  }};
  assert.deepEqual(selectLibrary(mixed,'level:StoryWeaver:2'), {label:'StoryWeaver · 2级故事',files:['c.jpg'],bytes:4});
  assert.deepEqual(selectLibrary(mixed,'level:Storybooks Canada:2').files,['b.jpg','b.mp3']);
  assert.deepEqual(selectLibrary(mixed,'level:2').files,['b.jpg','b.mp3']);
});
test('media validation rejects changed bytes while leaving the response readable', async () => {
  const bytes = 'intact audio', hash = createHash('sha256').update(bytes).digest('hex');
  const response = new Response(bytes);
  await verifyAsset(response,hash); assert.equal(await response.text(),bytes);
  await assert.rejects(verifyAsset(new Response('damaged'),hash), /校验失败/);
});
