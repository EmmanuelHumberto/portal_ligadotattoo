import {readdir,readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';

const controllerDir='apps/api/src';
const actual=new Set();

async function walk(path){
 for(const name of await readdir(path)){
  const file=join(path,name);
  if((await stat(file)).isDirectory()){
   await walk(file);continue;
  }
  if(!/controller(?:\.v\d+)?\.ts$/.test(name))continue;
  const source=await readFile(file,'utf8');
  const controller=/@Controller\(([^)]*)\)/.exec(source);
  if(!controller)continue;
  const base=literal(controller[1]??'');
  for(const match of source.matchAll(/@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/g)){
   const method=String(match[1]).toUpperCase();
   const suffix=literal(match[2]??'');
   actual.add(`${method} ${normalize([base,suffix].filter(Boolean).join('/'))}`);
  }
 }
}

function literal(value){
 const trimmed=value.trim();
 if(!trimmed)return '';
 const match=/^['"]([^'"]*)['"]$/.exec(trimmed);
 return match?.[1]??'';
}

function normalize(path){
 return `/${path}`.replace(/\/+/g,'/').replace(/:([A-Za-z0-9_]+)/g,'{$1}');
}

function openApiOperations(source){
 const operations=new Set();
 let path='';
 for(const line of source.split(/\r?\n/)){
  const pathMatch=/^  (\/[^:]+):\s*$/.exec(line);
  if(pathMatch){path=pathMatch[1]??'';continue;}
  const method=/^    (get|post|put|patch|delete):\s*$/.exec(line);
  if(path&&method)operations.add(`${method[1]?.toUpperCase()} ${path}`);
 }
 return operations;
}

await walk(controllerDir);
const declared=openApiOperations(await readFile('portal.openapi.yaml','utf8'));
const undocumented=[...actual].filter(x=>!declared.has(x)).sort();
const nonexistent=[...declared].filter(x=>!actual.has(x)).sort();

console.log(`runtime operations: ${actual.size}`);
console.log(`OpenAPI operations: ${declared.size}`);
if(undocumented.length){
 console.log('\nUndocumented runtime operations:');
 undocumented.forEach(x=>console.log(`  ${x}`));
}
if(nonexistent.length){
 console.log('\nDeclared operations absent from runtime:');
 nonexistent.forEach(x=>console.log(`  ${x}`));
}
if(process.argv.includes('--check')&&(undocumented.length||nonexistent.length))
 process.exit(1);
