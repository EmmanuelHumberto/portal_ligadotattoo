import {Pool} from 'pg';
import {validateRuntimeConfig} from './runtime-config';
import {applySyntheticFixtures,fixtureConfig} from './bootstrap-fixtures';

async function run(){
 const cfg=validateRuntimeConfig(process.env);
 const fixtures=fixtureConfig(process.env);
 const pool=new Pool({connectionString:cfg.databaseUrl});
 const client=await pool.connect();
 try {
  await client.query('begin');
  await client.query(`insert into platform_setting(key,value)
  values ('architecture_version','AR-47')
  on conflict(key) do update set value=excluded.value`);
  if(fixtures.enabled) await applySyntheticFixtures(client);
  await client.query('commit');
  console.log(`bootstrap complete (synthetic fixtures: ${fixtures.enabled?'on':'off'})`);
 } catch(error) {
  await client.query('rollback');
  throw error;
 } finally {
  client.release();
  await pool.end();
 }
}
run().catch(e=>{console.error(e);process.exit(1)});
