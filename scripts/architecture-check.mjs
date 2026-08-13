import {readdir,readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';

const roots=['apps/web','apps/api','apps/worker'];
const violations=[];
async function walk(p){
 for(const n of await readdir(p)){
  const f=join(p,n);const s=await stat(f);
  if(s.isDirectory()){if(n!=='node_modules'&&n!=='.next'&&n!=='dist')await walk(f);continue}
  if(!/\.(ts|tsx|js|mjs)$/.test(n))continue;
  const t=await readFile(f,'utf8');
  if(f.startsWith('apps/web')&&/(OPENAI_API_KEY|ANTHROPIC_API_KEY|DEEPSEEK_API_KEY)/.test(t))
   violations.push(`${f}: provider credential reference in Web`);
  if(!f.includes('safe-url')&&/fetch\(\s*(input|url|sourceUrl)/.test(t))
   violations.push(`${f}: possible uncontrolled dynamic fetch`);
 }
}
for(const r of roots)await walk(r);
if(violations.length){console.error(violations.join('\n'));process.exit(1)}
console.log('architecture static checks OK');
