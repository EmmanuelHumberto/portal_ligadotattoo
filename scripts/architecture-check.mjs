import {readdir,readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';

const roots=['apps/web','apps/api','apps/worker'];
const violations=[];
const controllerSqlBaseline=new Set([
 'apps/api/src/platform/health.controller.ts',
]);
// Fronteiras HTTP não aceitam `any`: toda entrada deve ser desconhecida até
// passar por parser/validador ou possuir um tipo de framework explícito.
async function walk(p){
 for(const n of await readdir(p)){
  const f=join(p,n);const s=await stat(f);
  if(s.isDirectory()){if(n!=='node_modules'&&n!=='.next'&&n!=='dist')await walk(f);continue}
  if(!/\.(ts|tsx|js|mjs)$/.test(n))continue;
  const t=await readFile(f,'utf8');
  if(f.startsWith('apps/web')&&/(OPENAI_API_KEY|ANTHROPIC_API_KEY|DEEPSEEK_API_KEY)/.test(t))
   violations.push(`${f}: provider credential reference in Web`);
  if(f.startsWith('apps/web')&&
     (/\bas\s+any\b/.test(t)||/:\s*any\b/.test(t)||/<any>/.test(t)||/Array<any>/.test(t)))
   violations.push(`${f}: Web contract uses explicit any`);
  if(!f.includes('safe-url')&&/fetch\(\s*(input|url|sourceUrl)/.test(t))
   violations.push(`${f}: possible uncontrolled dynamic fetch`);
  if(f.startsWith('apps/worker/src/ingestion/')&&
     !f.endsWith('/http-acquirer.ts')&&
     (/\bfetch\s*\(/.test(t)||/from ['"]node:https?['"]/.test(t)))
   violations.push(`${f}: ingestion network access bypasses HttpAcquirer`);
  if(/apps\/api\/src\/.*controller(?:\.v\d+)?\.ts$/.test(f)&&
     !controllerSqlBaseline.has(f)&&
     (/\bPG_POOL\b/.test(t)||/\bpool\.query\s*\(/.test(t)))
   violations.push(`${f}: new controller accesses PostgreSQL directly`);
  if(/apps\/api\/src\/.*controller(?:\.v\d+)?\.ts$/.test(f)){
   if(/@(Body|Actor|Req)\(\)\s+[A-Za-z_][A-Za-z0-9_]*:\s*any\b/.test(t))
    violations.push(`${f}: untyped HTTP boundary uses any`);
  }
  if(/api\.(deepseek|openai|anthropic)\.com/.test(t)&&
     !f.includes('/ai/adapters/'))
   violations.push(`${f}: AI provider access bypasses Provider Hub adapters`);
  if(f.includes('apps/worker/src/commerce/catalog-')&&
     /insert into knowledge\.canonical_fact/i.test(t))
   violations.push(`${f}: catalog acquisition promotes canonical authority`);
  if(f.includes('apps/worker/src/commerce/catalog-')&&
     /'PERMITTED'\s*,\s*'ACTIVE'|values[^;]*'PERMITTED'[^;]*decided_by/is.test(t))
   violations.push(`${f}: catalog acquisition grants media rights`);
  if(f.endsWith('apps/worker/src/commerce/catalog-discovery.handler.ts')&&
     t.split(/\r?\n/).length>250)
   violations.push(`${f}: discovery orchestrator exceeds 250 lines`);
 }
}
for(const r of roots)await walk(r);
if(violations.length){console.error(violations.join('\n'));process.exit(1)}
console.log('architecture static checks OK');
