import {createClient} from './account-runtime/client.js';
import {storage,validateArchive} from './account-storage.js';
export const client=createClient({subject:'reading',storage,validateRestore:validateArchive});
export const {accountState}=client;
