import {readFile,writeFile} from 'node:fs/promises';
const books=JSON.parse(await readFile(new URL('../web/data/books.json',import.meta.url),'utf8'));
await writeFile(new URL('../domain/catalog.json',import.meta.url),JSON.stringify(books.map(b=>({id:b.id,pages:b.pages.map(p=>p.text)}))));
