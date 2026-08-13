import {setTimeout as sleep} from 'node:timers/promises';
import {Pool} from 'pg';
import {createRuntimeProcessors,ProcessorRegistry} from './processors';

async function main(){
 const databaseUrl=process.env.DATABASE_URL?.trim();
 if(!databaseUrl)throw new Error('Missing required environment variable: DATABASE_URL');
 const intervalMs=positiveInteger(process.env.WORKER_POLL_INTERVAL_MS,1000);
 const pool=new Pool({connectionString:databaseUrl,max:5});
 await pool.query('select 1');
 const abort=new AbortController();
 process.on('SIGTERM',()=>abort.abort());
 process.on('SIGINT',()=>abort.abort());
 const processors=createRuntimeProcessors(pool);
 const registry=new ProcessorRegistry(processors);
 console.log('portal-worker started',{processors:processors.map(x=>x.key)});
 try {
  while(!abort.signal.aborted){
   await registry.tick({signal:abort.signal});
   await sleep(intervalMs,undefined,{signal:abort.signal}).catch(()=>undefined);
  }
 } finally {
  await pool.end();
 }
 console.log('portal-worker stopped');
}
main().catch(e=>{console.error(e);process.exit(1)});

function positiveInteger(value:string|undefined,fallback:number) {
 const parsed=Number(value??fallback);
 if(!Number.isInteger(parsed)||parsed<50)throw new Error('Invalid WORKER_POLL_INTERVAL_MS');
 return parsed;
}
