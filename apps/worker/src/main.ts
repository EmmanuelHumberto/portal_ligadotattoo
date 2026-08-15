import {setTimeout as sleep} from 'node:timers/promises';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {createRuntimeProcessors,ProcessorRegistry} from './processors';
import {WorkerHeartbeat} from './worker-heartbeat';

async function main(){
 const databaseUrl=process.env.DATABASE_URL?.trim();
 if(!databaseUrl)throw new Error('Missing required environment variable: DATABASE_URL');
 const intervalMs=positiveInteger(process.env.WORKER_POLL_INTERVAL_MS,1000);
 const pool=new Pool({connectionString:databaseUrl,max:5,connectionTimeoutMillis:2000});
 pool.on('error',(error:NodeJS.ErrnoException)=>
  console.error('worker_database_pool_error',{code:error.code??'UNKNOWN'}));
 await pool.query('select 1');
 const abort=new AbortController();
 process.on('SIGTERM',()=>abort.abort());
 process.on('SIGINT',()=>abort.abort());
 const processors=createRuntimeProcessors(pool);
 const registry=new ProcessorRegistry(processors);
 const heartbeat=new WorkerHeartbeat(pool,randomUUID(),processors.length);
 await heartbeat.start();
 console.log('portal-worker started',{
  instanceId:heartbeat.instanceId,processors:processors.map(x=>x.key),
 });
 try {
  while(!abort.signal.aborted){
   try {
    await heartbeat.tickStarted();
    const result=await registry.tick({signal:abort.signal});
    await heartbeat.tickCompleted(result.failures);
   } catch (error) {
    // Erro transitório de um tick não deve derrubar o worker.
    console.error('worker_tick_error',{code:errorCode(error)});
   }
   await sleep(intervalMs,undefined,{signal:abort.signal}).catch(()=>undefined);
  }
 } finally {
  await heartbeat.stop().catch(error=>console.error(
   'worker_heartbeat_stop_failed',{code:errorCode(error)},
  ));
  await pool.end();
 }
 console.log('portal-worker stopped');
}

function errorCode(error:unknown) {
 return error&&typeof error==='object'&&'code' in error
  ? String(error.code).slice(0,80):'WORKER_ERROR';
}
main().catch(error=>{
 console.error('portal-worker fatal',{code:errorCode(error)});process.exit(1);
});

function positiveInteger(value:string|undefined,fallback:number) {
 const parsed=Number(value??fallback);
 if(!Number.isInteger(parsed)||parsed<50)throw new Error('Invalid WORKER_POLL_INTERVAL_MS');
 return parsed;
}
