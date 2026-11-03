export const STORAGE_KEY = 'reading-garden-v1';
export const emptyState = () => ({progress: {}, words: [], voice: '', largeText: false, pinyinScopes: ['finals']});

export function normalizeState(input, books) {
  const clean = emptyState();
  if (!input || typeof input !== 'object') return clean;
  for (const book of books) {
    const p = input.progress?.[book.id];
    if (p && Number.isInteger(p.page)) clean.progress[book.id] = {page: Math.max(0, Math.min(book.pages.length - 1, p.page)), finished: p.finished === true, updated: Number.isFinite(p.updated) ? p.updated : 0};
  }
  clean.words = Array.isArray(input.words) ? input.words.filter(w => {
    const b = books.find(b => b.id === w?.bookId);
    return b && Number.isInteger(w.page) && w.page >= 0 && w.page < b.pages.length && typeof w.char === 'string' && /^\p{Script=Han}$/u.test(w.char) && b.pages[w.page].text.includes(w.char);
  }).slice(0, 200).map(w => ({char: w.char, bookId: w.bookId, page: w.page})) : [];
  clean.words = clean.words.filter((w, i, all) => all.findIndex(x => x.char === w.char) === i);
  clean.voice = typeof input.voice === 'string' ? input.voice : '';
  clean.largeText = input.largeText === true;
  if (Array.isArray(input.pinyinScopes)) clean.pinyinScopes = ['initials', 'finals', 'whole'].filter(id => input.pinyinScopes.includes(id));
  return clean;
}

export function routeFromHash(hash, books) {
  const [section, id, page] = hash.replace(/^#\/?/, '').split('/');
  if (section === 'book') {
    const book = books.find(b => b.id === id);
    if (book) return {section: 'book', book, page: Math.max(0, Math.min(book.pages.length - 1, (parseInt(page, 10) || 1) - 1))};
  }
  return {section: ['pinyin', 'words', 'parent'].includes(section) ? section : 'shelf'};
}

export function updateProgress(state, book, page, finished = false, now = Date.now()) {
  return {...state, progress: {...state.progress, [book.id]: {page, finished: finished || state.progress[book.id]?.finished === true, updated: now}}};
}

export const WORDS = [
  ['喜欢', '心里觉得很好，愿意亲近它。'], ['看书', '看书里的文字和图画。'], ['妹妹', '家里比自己小的女孩。'], ['熟睡', '睡得很香，很安静。'],
  ['妈妈', '我们的家人。'], ['奶奶', '爸爸的妈妈。'], ['爸爸', '我们的家人。'], ['爷爷', '爸爸的爸爸。'], ['自己', '就是你本人。'],
  ['鳄鱼', '一种嘴巴长长、尾巴有力的动物。'], ['肚子', '身体前面、胸部下面的地方。'], ['慢慢', '速度不快，一点一点地。'], ['悄悄', '声音很轻，不让别人发现。'], ['东西', '这里指可以吃的食物。'], ['高兴', '心里很开心。'],
  ['床底下', '床的下面。'], ['碗柜', '放碗、盘子等餐具的柜子。'], ['沙发', '家里可以坐着休息的软椅子。'], ['垃圾桶', '放垃圾的容器。'], ['篮子', '可以装东西、提着走的容器。'], ['房子', '人们居住的建筑。'], ['里面', '一个地方的内部。'], ['外面', '一个地方的外部。'], ['后面', '一个东西的背后。'], ['上面', '一个东西的上方。'], ['旁边', '靠近一个东西的地方。'], ['小猫猫', '故事里可爱的小猫。']
];

export function wordInContext(text, index) {
  const matches = WORDS.filter(([word]) => {
    let start = text.indexOf(word);
    while (start !== -1) {
      if (index >= start && index < start + word.length) return true;
      start = text.indexOf(word, start + 1);
    }
    return false;
  }).sort((a, b) => b[0].length - a[0].length);
  return {char: text[index], word: matches[0]?.[0] || text[index], meaning: matches[0]?.[1] || '把这个字放回故事里，再听一听、读一读。'};
}

export function quizChoices(items, answerIndex, random = Math.random, count = 3) {
  const others = items.filter((_, i) => i !== answerIndex);
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
  const choices = [...others.slice(0, Math.max(1, Math.min(3, count) - 1)), items[answerIndex]];
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  return choices;
}
