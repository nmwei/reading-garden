import {readFileSync} from 'node:fs';
import {readingContract} from '../domain/archive.js';
const validateArchive=readingContract(JSON.parse(readFileSync(new URL('../domain/catalog.json',import.meta.url),'utf8')));
export default Object.freeze({id:'reading',validateArchive});
