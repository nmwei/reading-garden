// Course symbols and complete CLI recording syllables are separate: a syllable
// used to demonstrate an initial/final must never be labelled as its pure sound.
const colors = ['peach', 'sage', 'butter', 'lavender'];
function items(rows, prefix = '', mode = 'direct') {
  return rows.map(([symbol, recording, spoken, tip, note], i) => ({
    id: prefix + (symbol === 'ü' ? 'v' : symbol === 'üe' ? 've' : symbol === 'ün' ? 'vn' : symbol),
    symbol, recording, spoken, tip, note: note || '示范采用第一声，先听一听，再跟着读。', mode, color: colors[i % colors.length]
  }));
}
export const VOWELS = items([
  ['a', 'a1', 'ā', '嘴巴张大，声音自然地出来。'],
  ['o', 'o1', 'ō', '嘴巴拢圆，声音轻轻送出来。'],
  ['e', 'e1', 'ē', '嘴巴微张，嘴角向两边展开。'],
  ['i', 'yi1', 'yī', '牙齿靠近，嘴角向两边展开。', 'i 单独成为音节时写作 yi，示范读 yī。'],
  ['u', 'wu1', 'wū', '嘴唇向前，拢成一个小圆洞。', 'u 单独成为音节时写作 wu，示范读 wū。'],
  ['ü', 'yu1', 'yū', '先摆好 i 的口型，再把嘴唇拢圆。', 'ü 单独成为音节时写作 yu，省去两点，示范读 yū。']
]);
const compounds = items([
  ['ai', 'ai1', 'āi', '先发 a，再慢慢滑向 i。'],
  ['ei', 'ei1', 'ēi', '先发 e，再慢慢滑向 i。'],
  ['ui', 'wei1', 'wēi', '嘴唇先拢圆，再向两边展开。', '借完整音节 wēi 听 ui；ui 在拼写中是 uei 的缩写。'],
  ['ao', 'ao1', 'āo', '从 a 开始，嘴巴慢慢收拢。'],
  ['ou', 'ou1', 'ōu', '先发 o，再把嘴唇收拢。'],
  ['iu', 'you1', 'yōu', '从 i 开始，嘴唇慢慢拢圆。', '借完整音节 yōu 听 iu；iu 在拼写中是 iou 的缩写。'],
  ['ie', 'ye1', 'yē', '从 i 开始，嘴巴慢慢打开。', 'ie 单独成为音节时写作 ye，示范读 yē。'],
  ['üe', 'yue1', 'yuē', '先拢圆嘴唇，再慢慢打开。', 'üe 单独成为音节时写作 yue，省去两点，示范读 yuē。']
]);
const special = items([['er', 'er1', 'ēr', '嘴巴微张，舌尖轻轻卷起。', 'er 是特殊韵母，单独认读，不和声母拼在一起。示范采用第一声。']]);
const frontNasal = items([
  ['an', 'an1', 'ān', '先张大嘴，最后舌尖抵住上牙龈。'],
  ['en', 'en1', 'ēn', '嘴巴微张，最后舌尖抵住上牙龈。'],
  ['in', 'yin1', 'yīn', '从 i 开始，最后舌尖抵住上牙龈。', 'in 单独成为音节时写作 yin，示范读 yīn。'],
  ['un', 'wen1', 'wēn', '嘴唇先拢圆，最后舌尖抵住上牙龈。', '借完整音节 wēn 听 un；un 在这里是 uen 的缩写，不是 ün。'],
  ['ün', 'yun1', 'yūn', '先摆好 ü 的口型，最后舌尖抵住上牙龈。', 'ün 单独成为音节时写作 yun，省去两点，示范读 yūn。']
]);
const backNasal = items([
  ['ang', 'ang1', 'āng', '嘴巴张开，舌根抬起，让声音从鼻腔出来。'],
  ['eng', 'eng1', 'ēng', '嘴巴微张，舌根抬起，让声音从鼻腔出来。'],
  ['ing', 'ying1', 'yīng', '从 i 开始，舌根抬起，让声音从鼻腔出来。', 'ing 单独成为音节时写作 ying，示范读 yīng。'],
  ['ong', 'ong1', 'ōng', '嘴唇拢圆，最后舌根抬起。', '独立示范来自 ChinaHelp，由家长试听选定；不带声母 h 或 d。']
]);
export const FINAL_GROUPS = [
  {id: 'single', label: '单韵母', items: VOWELS},
  {id: 'compound', label: '复韵母', items: compounds},
  {id: 'special', label: '特殊韵母', items: special},
  {id: 'front', label: '前鼻韵母', items: frontNasal},
  {id: 'back', label: '后鼻韵母', items: backNasal}
];
export const FINALS = FINAL_GROUPS.flatMap(group => group.items);
export const INITIALS = items([
  ['b', 'bo1', 'bō', '双唇闭上，轻轻放开。'],
  ['p', 'po1', 'pō', '双唇闭上，放开时送出一口气。'],
  ['m', 'mo1', 'mō', '双唇闭上，让声音从鼻腔出来。'],
  ['f', 'fo1', 'fō', '上牙轻触下唇，轻轻送气。'],
  ['d', 'de1', 'dē', '舌尖抵住上牙龈，轻轻放开。'],
  ['t', 'te1', 'tē', '舌尖抵住上牙龈，放开时送气。'],
  ['n', 'ne1', 'nē', '舌尖抵住上牙龈，声音从鼻腔出来。'],
  ['l', 'le1', 'lē', '舌尖抵住上牙龈，让声音从舌头两边出来。'],
  ['g', 'ge1', 'gē', '舌根抬起，再轻轻放开。'],
  ['k', 'ke1', 'kē', '舌根抬起，放开时送气。'],
  ['h', 'he1', 'hē', '嘴巴微张，让气轻轻擦过舌根。'],
  ['j', 'ji1', 'jī', '舌面靠近上腭，轻轻放开。'],
  ['q', 'qi1', 'qī', '舌面靠近上腭，放开时送气。'],
  ['x', 'xi1', 'xī', '舌面靠近上腭，让气轻轻擦过。'],
  ['zh', 'zhi1', 'zhī', '舌尖翘起，轻轻放开。'],
  ['ch', 'chi1', 'chī', '舌尖翘起，放开时送气。'],
  ['sh', 'shi1', 'shī', '舌尖翘起，让气轻轻擦过。'],
  ['r', 'ri1', 'rī', '舌尖翘起，发声时声带振动。'],
  ['z', 'zi1', 'zī', '舌尖向前，不翘舌，轻轻放开。'],
  ['c', 'ci1', 'cī', '舌尖向前，不翘舌，放开时送气。'],
  ['s', 'si1', 'sī', '舌尖向前，不翘舌，让气轻轻擦过。']
], 'initial-', 'initial').map(item => ({...item, note: `这里用呼读音 ${item.spoken} 认识声母 ${item.symbol}。呼读音带有元音，拼读时声母要读得轻、短；不是单独本音录音。`}));
export const SPELLING_LETTERS = items([
  ['y', 'yi1', 'yī', '和 i 交朋友，看看 yi 怎么写。', 'y 是拼写字母。i 单独成为音节时写作 yi，示范读 yī。'],
  ['w', 'wu1', 'wū', '和 u 交朋友，看看 wu 怎么写。', 'w 是拼写字母。u 单独成为音节时写作 wu，示范读 wū。']
], 'letter-', 'spelling');
export const WHOLE_SYLLABLES = items([
  ['zhi', 'zhi1', 'zhī', '舌尖翘起，整个音节一起读。'],
  ['chi', 'chi1', 'chī', '舌尖翘起，送气，整个音节一起读。'],
  ['shi', 'shi1', 'shī', '舌尖翘起，整个音节一起读。'],
  ['ri', 'ri1', 'rī', '舌尖翘起，整个音节一起读。'],
  ['zi', 'zi1', 'zī', '舌尖向前，不翘舌，整个音节一起读。'],
  ['ci', 'ci1', 'cī', '舌尖向前，送气，整个音节一起读。'],
  ['si', 'si1', 'sī', '舌尖向前，不翘舌，整个音节一起读。'],
  ['yi', 'yi1', 'yī', '嘴角展开，整个音节一起读。'],
  ['wu', 'wu1', 'wū', '嘴唇拢圆，整个音节一起读。'],
  ['yu', 'yu1', 'yū', '摆好 ü 的口型，整个音节一起读。'],
  ['ye', 'ye1', 'yē', '嘴巴慢慢打开，整个音节一起读。'],
  ['yue', 'yue1', 'yuē', '嘴唇先拢圆再打开，整个音节一起读。'],
  ['yuan', 'yuan1', 'yuān', '嘴唇先拢圆，最后舌尖抵住上牙龈。'],
  ['yin', 'yin1', 'yīn', '嘴角展开，最后舌尖抵住上牙龈。'],
  ['yun', 'yun1', 'yūn', '摆好 ü 的口型，最后舌尖抵住上牙龈。'],
  ['ying', 'ying1', 'yīng', '嘴角展开，最后舌根抬起。']
], 'whole-', 'whole').map(item => ({...item, note: '整体认读，不拆开拼。示范采用第一声。'}));
export const PINYIN_ITEMS = [...FINALS, ...INITIALS, ...SPELLING_LETTERS, ...WHOLE_SYLLABLES];
export const PRACTICE_GROUPS = [
  ...FINAL_GROUPS.filter(group => group.items.length >= 2),
  {id: 'initials', label: '声母呼读音', items: INITIALS},
  {id: 'letters', label: 'y 和 w', items: SPELLING_LETTERS},
  {id: 'whole', label: '整体认读', items: WHOLE_SYLLABLES}
];
const TONE_SHAPES = [
  {name: '第一声', tip: '声音高高的，平平走。', points: '12,25 88,25'},
  {name: '第二声', tip: '声音从低往高，像上坡。', points: '12,65 88,20'},
  {name: '第三声', tip: '单独读时，先降下来，再扬上去。', points: '12,35 47,80 88,25'},
  {name: '第四声', tip: '声音从高往低，干脆落下。', points: '12,20 88,75'}
];
export const TONE_GROUPS = [
  {label: '基础音', bases: [
    ['a', ['ā', 'á', 'ǎ', 'à']], ['o', ['ō', 'ó', 'ǒ', 'ò']], ['e', ['ē', 'é', 'ě', 'è']],
    ['yi', ['yī', 'yí', 'yǐ', 'yì']], ['wu', ['wū', 'wú', 'wǔ', 'wù']], ['yu', ['yū', 'yú', 'yǔ', 'yù']]
  ]},
  {label: '复韵音节', bases: [
    ['ai', ['āi', 'ái', 'ǎi', 'ài']], ['ao', ['āo', 'áo', 'ǎo', 'ào']], ['wei', ['wēi', 'wéi', 'wěi', 'wèi']],
    ['you', ['yōu', 'yóu', 'yǒu', 'yòu']], ['yue', ['yuē', 'yué', 'yuě', 'yuè']]
  ]},
  {label: '前鼻音节', bases: [['an', ['ān', 'án', 'ǎn', 'àn']], ['yun', ['yūn', 'yún', 'yǔn', 'yùn']]]},
  {label: '后鼻音节', bases: [['ang', ['āng', 'áng', 'ǎng', 'àng']], ['ying', ['yīng', 'yíng', 'yǐng', 'yìng']], ['dong', ['dōng', 'dóng', 'dǒng', 'dòng']]]},
  {label: '平舌与翘舌', bases: [['zi', ['zī', 'zí', 'zǐ', 'zì']], ['zhi', ['zhī', 'zhí', 'zhǐ', 'zhì']]]},
  {label: '再听两组', bases: [['er', ['ēr', 'ér', 'ěr', 'èr']], ['ma', ['mā', 'má', 'mǎ', 'mà']]]}
].map(group => ({...group, bases: group.bases.map(([id, forms]) => ({id, forms}))}));
export const TONE_BASES = TONE_GROUPS.flatMap(group => group.bases);
export function toneExamples(baseId = 'a') {
  const base = TONE_BASES.find(base => base.id === baseId);
  return base ? TONE_SHAPES.map((shape, i) => ({...shape, id: `tone-${base.id}-${i + 1}`, recording: `${base.id}${i + 1}`, symbol: base.forms[i]})) : [];
}
export const TONES = TONE_BASES.flatMap(base => toneExamples(base.id));

// Multi-selection chooses categories; each question stays within one category
// so same-sounding spellings (i/yi, u/wu) never compete as different answers.
export const PRACTICE_CATEGORIES = [
  {id: 'initials', label: '声母', items: INITIALS},
  {id: 'finals', label: '韵母', items: FINALS},
  {id: 'whole', label: '整体认读', items: WHOLE_SYLLABLES}
];
export function nextPracticeCategory(scopes, previous) {
  const selected = PRACTICE_CATEGORIES.filter(group => scopes.includes(group.id));
  return selected.length ? selected[(selected.findIndex(group => group.id === previous) + 1) % selected.length] : null;
}
export function practicePool(scope) {
  const group = PRACTICE_CATEGORIES.find(group => group.id === scope);
  const heard = new Set();
  return (group?.items || []).filter(item => {
    if (!pinyinAudio(item.id) || heard.has(item.recording)) return false;
    heard.add(item.recording); return true;
  });
}
// Missing/rejected examples remain in the course but cannot play or enter quizzes.
export const PINYIN_RECORDINGS = Object.fromEntries([...PINYIN_ITEMS, ...TONES].filter(item => item.recording).map(item => [item.id, item.recording]));
export const pinyinAudio = id => Object.hasOwn(PINYIN_RECORDINGS, id) ? `assets/pinyin/${id}.mp3` : null;
export const listeningItems = groupId => (PRACTICE_GROUPS.find(group => group.id === groupId)?.items || []).filter(item => pinyinAudio(item.id));
export const toneName = recording => ['第一声', '第二声', '第三声', '第四声'][Number(recording?.slice(-1)) - 1] || '';
