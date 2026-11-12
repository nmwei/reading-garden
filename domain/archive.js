import {envelope,requireValue as check,exact,record} from '@garden/account/envelope';
export const READING_KEY='reading-state-v1';
export function readingContract(catalog) {
 const bookMap=new Map(catalog.map(book=>[book.id,book.pages]));
 return snapshot=>{
  envelope(snapshot,'reading',[READING_KEY]);
  const s=snapshot.data[READING_KEY];if(s===undefined)return snapshot;
  exact(s,['version','progress','readingList','words','pinyinScopes']);check(s.version===1&&record(s.progress));
  for(const [id,p] of Object.entries(s.progress)){
   exact(p,['page','finished','updated','rereading']);const pages=bookMap.get(id);
   check(pages&&Number.isInteger(p.page)&&p.page>=0&&p.page<pages.length,'阅读位置不在当前书目内');
   check(typeof p.finished==='boolean'&&Number.isFinite(p.updated)&&p.updated>=0);
   if(p.rereading!==undefined)check(typeof p.rereading==='boolean');
   if(p.finished&&p.page<pages.length-1)check(p.rereading===true);
  }
  check(Array.isArray(s.readingList)&&s.readingList.length<=6&&new Set(s.readingList).size===s.readingList.length&&s.readingList.every(id=>bookMap.has(id)),'书单无效');
  check(Array.isArray(s.words)&&s.words.length<=200&&new Set(s.words.map(w=>w?.char)).size===s.words.length);
  for(const w of s.words){exact(w,['char','bookId','page']);const pages=bookMap.get(w.bookId);check(typeof w.char==='string'&&/^\p{Script=Han}$/u.test(w.char)&&pages&&Number.isInteger(w.page)&&typeof pages[w.page]==='string'&&pages[w.page].includes(w.char),'生字与绘本语境不一致');}
  check(Array.isArray(s.pinyinScopes)&&new Set(s.pinyinScopes).size===s.pinyinScopes.length&&s.pinyinScopes.every(id=>['initials','finals','whole'].includes(id)));
  return snapshot;
 };
}
