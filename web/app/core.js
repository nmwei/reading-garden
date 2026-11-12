import {readingContract,READING_KEY} from '../domain/archive.js';
export const READING_LIST_LIMIT = 6;
export const emptyState = () => ({progress: {}, readingList: [], words: [], voice: '', readingHelpSeen: false, pinyinScopes: ['finals']});

// Persisted learning data is current-format only: never repair it into a different archive.
export function restoreState(input, books) {
  if (input === null) return emptyState();
  readingContract(books.map(book=>({id:book.id,pages:book.pages.map(page=>page.text)})))({version:1,subject:'reading',data:{[READING_KEY]:input}});
  const {version,...learning}=structuredClone(input);
  return {...emptyState(),...learning};
}

export function routeFromHash(hash, books) {
  const [section, id, page, action] = hash.replace(/^#\/?/, '').split('/');
  if (section === 'book') {
    const book = books.find(b => b.id === id);
    if (book) return {section: 'book', book, page: Math.max(0, Math.min(book.pages.length - 1, (parseInt(page, 10) || 1) - 1)), startReread: page === '1' && action === 'reread'};
  }
  return {section: ['library', 'pinyin', 'words', 'parent'].includes(section) ? section : 'shelf'};
}

export function updateProgress(state, book, page, {finished = false, now = Date.now(), startReread = false} = {}) {
  const previous = state.progress[book.id];
  const rereading = !finished && previous?.finished === true &&
    (startReread || previous.rereading === true || page < book.pages.length - 1);
  const progress = {page, finished: finished || previous?.finished === true, updated: now, ...(rereading ? {rereading} : {})};
  return {...state, progress: {...state.progress, [book.id]: progress}};
}

export const WORDS = [
  ['喜欢', '心里觉得很好，愿意亲近它。'], ['看书', '看书里的文字和图画。'], ['妹妹', '家里比自己小的女孩。'], ['熟睡', '睡得很香，很安静。'],
  ['妈妈', '我们的家人。'], ['奶奶', '爸爸的妈妈。'], ['爸爸', '我们的家人。'], ['爷爷', '爸爸的爸爸。'], ['自己', '就是你本人。'],
  ['鳄鱼', '一种嘴巴长长、尾巴有力的动物。'], ['肚子', '身体前面、胸部下面的地方。'], ['慢慢', '速度不快，一点一点地。'], ['悄悄', '声音很轻，不让别人发现。'], ['东西', '这里指可以吃的食物。'], ['高兴', '心里很开心。'],
  ['床底下', '床的下面。'], ['碗柜', '放碗、盘子等餐具的柜子。'], ['沙发', '家里可以坐着休息的软椅子。'], ['垃圾桶', '放垃圾的容器。'], ['篮子', '可以装东西、提着走的容器。'], ['房子', '人们居住的建筑。'], ['里面', '一个地方的内部。'], ['外面', '一个地方的外部。'], ['后面', '一个东西的背后。'], ['上面', '一个东西的上方。'], ['旁边', '靠近一个东西的地方。'], ['小猫猫', '故事里可爱的小猫。']
];

export function sentenceAt(text, index) {
  for (const match of text.matchAll(/[^\n。！？!?；;]+[。！？!?；;]*[”’」』）】]*/g)) {
    if (index >= match.index && index < match.index + match[0].length) return match[0].trim();
  }
  return text.trim();
}

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
