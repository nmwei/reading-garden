// A recording is playable only after it is enabled here. Never fall back to a
// rejected recording or generic TTS when the teaching reference is unavailable.
export const PINYIN_RECORDINGS = {
  o: 'File:LL-Q9192 (cmn)-Luilui6666-喔.wav',
  u: 'File:Zh-wū.oga',
  tone2: 'File:Zh-bá.ogg',
  tone4: 'File:Zh-bà.ogg'
};
export const pinyinAudio = id => Object.hasOwn(PINYIN_RECORDINGS, id) ? `assets/pinyin/${id}.mp3` : null;
export const listeningVowels = () => VOWELS.filter(vowel => pinyinAudio(vowel.id));

export const VOWELS = [
  {id: 'a', symbol: 'a', example: '啊', spelling: 'ā', tip: '嘴巴张大，声音自然地出来。', color: 'peach'},
  {id: 'o', symbol: 'o', example: '喔', spelling: 'ō', tip: '嘴巴拢圆，听一听例字的声音。', color: 'sage'},
  {id: 'e', symbol: 'e', example: '饿', spelling: 'è', tip: '嘴巴微张，嘴角向两边展开。', color: 'butter'},
  {id: 'i', symbol: 'i', example: '一', spelling: 'yī', tip: '牙齿靠近，嘴角向两边展开。', color: 'lavender'},
  {id: 'u', symbol: 'u', example: '屋', spelling: 'wū', tip: '嘴唇向前，拢成一个小圆洞。', color: 'peach'},
  {id: 'v', symbol: 'ü', example: '鱼', spelling: 'yú', tip: '先摆好 i 的口型，再把嘴唇拢圆。', color: 'sage'}
];
export const TONES = [
  {id: 'tone1', symbol: 'bā', example: '八', name: '第一声', tip: '声音高高的，平平走。', points: '12,25 88,25'},
  {id: 'tone2', symbol: 'bá', example: '拔', name: '第二声', tip: '声音从低往高，像上坡。', points: '12,65 88,20'},
  {id: 'tone3', symbol: 'bǎ', example: '把', name: '第三声', tip: '单独读时，先降下来，再扬上去。', points: '12,35 47,80 88,25'},
  {id: 'tone4', symbol: 'bà', example: '爸', name: '第四声', tip: '声音从高往低，干脆落下。', points: '12,20 88,75'}
];
