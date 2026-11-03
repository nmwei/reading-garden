import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AudioPlayer} from '../app/audio.js';

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
