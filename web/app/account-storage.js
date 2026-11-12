import {createStorage} from './account-runtime/storage.js';
import {READING_KEY,readingContract} from '../domain/archive.js';
const response=await fetch(new URL('../domain/catalog.json',import.meta.url));
if(!response.ok)throw Error('阅读数据契约暂时无法打开');
export const validateArchive=readingContract(await response.json());
export const storage=await createStorage({subject:'reading',ARCHIVE_KEYS:[READING_KEY],validateArchive,
 definition:key=>{if(key!==READING_KEY)throw Error('未登记的阅读数据');},projectLearningValue:(_key,value)=>value});
export const {learningStorage,flushStorage,storageNotice}=storage;
export {READING_KEY};

try{validateArchive(storage.captureArchive());}catch(error){storage.blockStorage('本机学习记录需要检查，原记录已保留：'+error.message);}
