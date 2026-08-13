import {readdir,readFile} from 'node:fs/promises';
const dir=new URL('../sql/',import.meta.url);
const files=(await readdir(dir)).filter(x=>x.endsWith('.sql')).sort();
if(!files.length)throw new Error('No SQL migrations');
let previous=-1;
for(const f of files){
 const m=/^(\d+)_/.exec(f);if(!m)throw new Error(`Migration not ordered: ${f}`);
 const n=Number(m[1]);if(n<=previous)throw new Error(`Migration order collision: ${f}`);
 previous=n;
 const text=await readFile(new URL(f,dir),'utf8');
 if(!text.trim())throw new Error(`Empty migration: ${f}`);
}
console.log(`migration chain OK: ${files.length} files`);
