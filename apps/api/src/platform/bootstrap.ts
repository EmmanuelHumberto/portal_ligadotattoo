import {Pool} from 'pg';
import {validateRuntimeConfig} from './runtime-config';

async function run(){
 const cfg=validateRuntimeConfig(process.env);
 const pool=new Pool({connectionString:cfg.databaseUrl});
 await pool.query(`insert into platform_setting(key,value)
 values ('architecture_version','AR-42')
 on conflict(key) do update set value=excluded.value`);
 console.log('bootstrap complete');
 await pool.end();
}
run().catch(e=>{console.error(e);process.exit(1)});
