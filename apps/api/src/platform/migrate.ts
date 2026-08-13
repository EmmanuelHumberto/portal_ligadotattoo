import {Pool} from 'pg';
import {readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateRuntimeConfig} from './runtime-config';

async function run(){
 const cfg=validateRuntimeConfig(process.env);
 const pool=new Pool({connectionString:cfg.databaseUrl});
 const dir=resolve(process.cwd(),'../../sql');
 await pool.query(`create table if not exists schema_migration(
   name text primary key, applied_at timestamptz not null default now()
 )`);
 const done=new Set((await pool.query('select name from schema_migration')).rows.map(x=>x.name));
 const files=(await readdir(dir)).filter(x=>x.endsWith('.sql')).sort();
 for(const name of files){
  if(done.has(name))continue;
  const sql=await readFile(resolve(dir,name),'utf8');
  const client=await pool.connect();
  try{
   await client.query('begin'); await client.query(sql);
   await client.query('insert into schema_migration(name) values($1)',[name]);
   await client.query('commit'); console.log(`applied ${name}`);
  }catch(e){await client.query('rollback');throw e}finally{client.release()}
 }
 await pool.end();
}
run().catch(e=>{console.error(e);process.exit(1)});
