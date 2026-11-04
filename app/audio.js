export class AudioPlayer {
  constructor(onChange) {
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.audio.setAttribute('playsinline', '');
    this.onChange = onChange;
    this.token = 0;
    this.playing = false;
    this.sequence = null;
    this.audio.addEventListener('ended', () => {
      if (!this.audio.ended) return;
      this.playing = false; onChange(false);
      const run = this.sequence;
      if (!run || run.paused) return;
      if (run.index === run.items.length - 1) { this.sequence = null; run.onState('done'); return; }
      run.between = true;
      run.timer = setTimeout(() => { run.index++; run.between = false; this.sequenceItem(run); }, run.gap);
    });
  }
  stop() {
    this.token++;
    if (this.sequence) { clearTimeout(this.sequence.timer); this.sequence.onState('idle'); this.sequence = null; }
    this.audio.pause();
    this.playing = false;
    globalThis.speechSynthesis?.cancel();
    this.onChange(false);
  }
  async play(src) {
    this.stop();
    return this.startAudio(src, this.token);
  }
  async startAudio(src, token, valid = () => true) {
    this.audio.src = new URL(src, document.baseURI).href;
    try {
      await this.audio.play();
      if (token !== this.token || !valid()) return false;
      this.playing = true;
      this.onChange(true);
      return true;
    } catch (error) {
      if (token !== this.token || error.name === 'AbortError') return false;
      throw error;
    }
  }
  async playSequence(items, {onItem = () => {}, onState = () => {}, gap = 300} = {}) {
    this.stop();
    if (!items.length) return false;
    const run = {items, index: 0, paused: false, between: false, attempt: 0, token: this.token, onItem, onState, gap};
    this.sequence = run;
    return this.sequenceItem(run);
  }
  async sequenceItem(run) {
    if (this.sequence !== run || run.paused) return false;
    const attempt = ++run.attempt;
    const item = run.items[run.index];
    run.onItem(item, run.index, run.items.length);
    run.onState('playing');
    try {
      const started = await this.startAudio(item.src, run.token, () => this.sequence === run && run.attempt === attempt && !run.paused);
      if (this.sequence !== run || run.attempt !== attempt) return false;
      if (!started && this.sequence === run) { this.sequence = null; run.onState('error'); }
      return started;
    } catch {
      if (this.sequence === run && run.attempt === attempt && !run.paused) { this.sequence = null; run.onState('error'); }
      return false;
    }
  }
  pauseSequence() {
    const run = this.sequence;
    if (!run || run.paused) return;
    clearTimeout(run.timer); run.paused = true; run.attempt++;
    this.audio.pause(); this.playing = false; this.onChange(false); run.onState('paused');
  }
  async resumeSequence() {
    const run = this.sequence;
    if (!run?.paused) return false;
    run.paused = false;
    if (run.between) { run.index++; run.between = false; return this.sequenceItem(run); }
    const attempt = ++run.attempt;
    try {
      await this.audio.play();
      if (this.sequence !== run || run.attempt !== attempt || run.paused) return false;
      this.playing = true; this.onChange(true); run.onState('playing'); return true;
    } catch {
      if (this.sequence === run && run.attempt === attempt) { this.sequence = null; run.onState('error'); }
      return false;
    }
  }
  speak(text, voiceURI, onError = () => {}) {
    this.stop();
    const voices = chineseVoices();
    const voice = voices.find(v => v.voiceURI === voiceURI) || voices.find(v => /zh[-_]CN|cmn[-_]CN/i.test(v.lang)) || voices[0];
    if (!voice || typeof globalThis.SpeechSynthesisUtterance !== 'function') return false;
    const utterance = new SpeechSynthesisUtterance(text);
    const token = this.token;
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = 0.8;
    utterance.onend = () => { if (token === this.token) { this.playing = false; this.onChange(false); } };
    utterance.onerror = () => {
      if (token !== this.token) return;
      this.playing = false;
      this.onChange(false);
      onError();
    };
    this.playing = true;
    this.onChange(true);
    try {
      speechSynthesis.speak(utterance);
    } catch {
      this.stop();
      return false;
    }
    return true;
  }
}
// Exclude the Eloquence voices rejected in listening tests. Keep unfamiliar
// voices available: installed names differ between Apple, Android and Windows.
const excludedVoiceName = /^(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)(?=$|[\s(（])/i;
export function chineseVoices() {
  return globalThis.speechSynthesis?.getVoices().filter(v =>
    /^(zh|cmn)(-|_|$)/i.test(v.lang) && !/yue|HK/i.test(v.lang) &&
    !excludedVoiceName.test(v.name) && !/^com\.apple\.eloquence\./i.test(v.voiceURI)
  ) || [];
}
