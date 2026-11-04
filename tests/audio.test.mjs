import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AudioPlayer, chineseVoices} from '../app/audio.js';

class TestAudio extends EventTarget {
  constructor() { super(); this.calls = []; this.ended = false; this.paused = true; this.pending = []; }
  setAttribute() {}
  play() {
    this.ended = false; this.paused = false; this.calls.push(this.src);
    return new Promise((resolve, reject) => this.pending.push({resolve, reject}));
  }
  pause() { this.paused = true; }
  finish() { this.ended = true; this.dispatchEvent(new Event('ended')); }
}
globalThis.Audio = TestAudio;
globalThis.document = {baseURI: 'https://example.test/reading-garden/'};
const entries = [{id: 'a', src: 'a.mp3'}, {id: 'o', src: 'o.mp3'}];
const tick = () => new Promise(resolve => setTimeout(resolve, 15));

function deviceVoices(t, voices) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'speechSynthesis');
  const previousUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance');
  const spoken = [];
  Object.defineProperty(globalThis, 'speechSynthesis', {configurable: true, value: {
    getVoices: () => voices, cancel() {}, speak(utterance) { spoken.push(utterance); }
  }});
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {configurable: true, value: class {
    constructor(text) { this.text = text; }
  }});
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'speechSynthesis', previous);
    else delete globalThis.speechSynthesis;
    if (previousUtterance) Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', previousUtterance);
    else delete globalThis.SpeechSynthesisUtterance;
  });
  return spoken;
}

test('Chinese voice choices exclude rejected names and localized Eloquence identifiers, retaining unfamiliar voices', t => {
  const excluded = ['Eddy', 'Flo', 'Grandma', 'Grandpa', 'Reed', 'Rocko', 'Sandy', 'Shelley'].flatMap(name =>
    ['zh-CN', 'zh-TW'].map(lang => ({name: `${name} (中文)`, lang, voiceURI: `${name}-${lang}`})));
  const retained = [
    {name: '婷婷', lang: 'zh-CN', voiceURI: 'tingting'},
    {name: '美嘉', lang: 'zh-TW', voiceURI: 'meijia'},
    {name: 'Google 普通话', lang: 'zh-CN', voiceURI: 'google'},
    {name: '新设备声音', lang: 'cmn_SG', voiceURI: 'new-device'}
  ];
  deviceVoices(t, [...excluded, ...retained,
    {name: '本地化名称', lang: 'zh-CN', voiceURI: 'com.apple.eloquence.zh-CN.Eddy'},
    {name: '粤语', lang: 'zh-HK', voiceURI: 'hk'},
    {name: 'English', lang: 'en-US', voiceURI: 'en'}
  ]);
  assert.deepEqual(chineseVoices(), retained);
});

test('automatic and previously saved excluded voices fall back to available mainland Mandarin; valid selections remain respected', t => {
  const excluded = {name: 'Rocko (中文)', lang: 'zh-CN', voiceURI: 'old-rocko'};
  const taiwan = {name: '美嘉', lang: 'zh-TW', voiceURI: 'meijia'};
  const mainland = {name: '婷婷', lang: 'zh-CN', voiceURI: 'tingting'};
  const spoken = deviceVoices(t, [excluded, taiwan, mainland]);
  const player = new AudioPlayer(() => {});
  for (const choice of ['', 'old-rocko', 'missing-voice']) {
    assert.equal(player.speak('我喜欢看书', choice), true);
    assert.equal(spoken.at(-1).voice, mainland);
  }
  player.speak('我喜欢看书', 'meijia');
  assert.equal(spoken.at(-1).voice, taiwan);
});

test('devices with only excluded voices report no usable voice instead of speaking with one', t => {
  const spoken = deviceVoices(t, [{name: 'Eddy', lang: 'zh-CN', voiceURI: 'eddy'}]);
  assert.equal(new AudioPlayer(() => {}).speak('我', 'eddy'), false);
  assert.equal(spoken.length, 0);
});

test('pause/resume during a pending first play cannot cancel the resumed queue', async () => {
  const states = [], player = new AudioPlayer(() => {});
  const start = player.playSequence(entries, {onState: state => states.push(state)});
  player.pauseSequence();
  const resume = player.resumeSequence();
  player.audio.pending[0].reject(new DOMException('Interrupted', 'AbortError'));
  assert.equal(await start, false);
  player.audio.pending[1].resolve();
  assert.equal(await resume, true);
  assert.ok(player.sequence);
  assert.equal(player.playing, true);
  assert.ok(!states.includes('error'));
  player.stop();
});
test('a manual selection cancels the queue and its pending follow-up timer', async () => {
  const player = new AudioPlayer(() => {});
  const start = player.playSequence(entries, {gap: 5});
  player.audio.pending[0].resolve(); await start;
  player.audio.finish();
  const manual = player.play('e.mp3'); player.audio.pending[1].resolve(); await manual;
  await tick();
  assert.equal(player.sequence, null);
  assert.deepEqual(player.audio.calls.map(src => src.split('/').at(-1)), ['a.mp3', 'e.mp3']);
});
test('pause between items resumes at the next item, then completes once', async () => {
  const states = [], player = new AudioPlayer(() => {});
  const start = player.playSequence(entries, {gap: 5, onState: state => states.push(state)});
  player.audio.pending[0].resolve(); await start;
  player.audio.finish(); player.pauseSequence(); await tick();
  assert.equal(player.audio.calls.length, 1);
  const resume = player.resumeSequence(); player.audio.pending[1].resolve(); await resume;
  player.audio.finish();
  assert.deepEqual(player.audio.calls.map(src => src.split('/').at(-1)), ['a.mp3', 'o.mp3']);
  assert.equal(states.filter(state => state === 'done').length, 1);
  assert.equal(player.sequence, null);
});
test('a failed sequence stops instead of skipping silently to another item', async () => {
  const states = [], player = new AudioPlayer(() => {});
  const start = player.playSequence(entries, {onState: state => states.push(state)});
  player.audio.pending[0].reject(new DOMException('Unavailable', 'NotSupportedError'));
  assert.equal(await start, false);
  assert.equal(states.at(-1), 'error');
  assert.equal(player.sequence, null);
  assert.equal(player.audio.calls.length, 1);
});
