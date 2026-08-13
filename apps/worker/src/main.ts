import {setTimeout as sleep} from 'node:timers/promises';
import {baselineProcessors,ProcessorRegistry} from './processors';

async function main(){
 const abort=new AbortController();
 process.on('SIGTERM',()=>abort.abort());
 process.on('SIGINT',()=>abort.abort());
 const registry=new ProcessorRegistry(baselineProcessors);
 console.log('portal-worker started',{processors:baselineProcessors.map(x=>x.key)});
 while(!abort.signal.aborted){
  await registry.tick({signal:abort.signal});
  await sleep(1000,undefined,{signal:abort.signal}).catch(()=>undefined);
 }
 console.log('portal-worker stopped');
}
main().catch(e=>{console.error(e);process.exit(1)});
