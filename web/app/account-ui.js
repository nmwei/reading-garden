import {createAccountUI} from './account-runtime/ui.js';
import {installStorageBanner} from './account-runtime/storage-banner.js';
import {storage,READING_KEY} from './account-storage.js';
import {client} from './account-client.js';
const archiveSummary=snapshot=>{const s=snapshot?.data?.[READING_KEY];return s?`读过 ${Object.keys(s.progress).length} 本 · 已读完 ${Object.values(s.progress).filter(p=>p.finished).length} 本 · 生字 ${s.words.length} 个`:'还没有阅读记录';};
export const {accountPanel,parentIdentity}=createAccountUI({subject:'reading',storage,client,archiveSummary});
installStorageBanner(storage);
