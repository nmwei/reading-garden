export class AudioPlayer {
  constructor(onChange) {
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.audio.setAttribute('playsinline', '');
    this.onChange = onChange;
    this.token = 0;
    this.playing = false;
    this.audio.addEventListener('ended', () => { this.playing = false; onChange(false); });
  }
  stop() {
    this.token++;
    this.audio.pause();
    this.playing = false;
    globalThis.speechSynthesis?.cancel();
    this.onChange(false);
  }
  async play(src) {
    this.stop();
    const token = this.token;
    this.audio.src = new URL(src, document.baseURI).href;
    try {
      await this.audio.play();
      if (token !== this.token) return false;
      this.playing = true;
      this.onChange(true);
      return true;
    } catch (error) {
      if (token !== this.token || error.name === 'AbortError') return false;
      throw error;
    }
  }
  speak(text, voiceURI) {
    this.stop();
    const voices = chineseVoices();
    const voice = voices.find(v => v.voiceURI === voiceURI) || voices.find(v => /zh[-_]CN|cmn[-_]CN/i.test(v.lang)) || voices[0];
    if (!voice) return false;
    const utterance = new SpeechSynthesisUtterance(text);
    const token = this.token;
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = 0.8;
    utterance.onend = () => { if (token === this.token) { this.playing = false; this.onChange(false); } };
    utterance.onerror = () => { if (token === this.token) { this.playing = false; this.onChange(false); } };
    this.playing = true;
    this.onChange(true);
    speechSynthesis.speak(utterance);
    return true;
  }
}
export function chineseVoices() {
  return globalThis.speechSynthesis?.getVoices().filter(v => /^(zh|cmn)(-|_|$)/i.test(v.lang) && !/yue|HK/i.test(v.lang)) || [];
}
