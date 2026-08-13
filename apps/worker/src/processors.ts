import {Pool} from 'pg';
import {
 DurableScheduler,workerRetentionDays,workerSchedulerIntervalMs,
} from './durable-scheduler';
import {ListingCandidateHandler} from './commerce/ingestion-listing-candidate.handler';
import {PriceTrendProjectionHandler} from './commerce/price-trend.handler';
import {ListingStalenessHandler} from './commerce/staleness.handler';
import {EditorialSearchProjectionHandler} from './editorial/editorial-search-projection.handler';
import {ScheduledPublicationHandler} from './editorial/scheduled-publication.handler';
import {DatabaseEventRouter} from './event-router';
import {ExtractionHandler} from './ingestion/extraction.handler';
import {HttpAcquirer} from './ingestion/http-acquirer';
import {IngestionRunner} from './ingestion/ingestion-runner';
import {JobHandler,JobRunner} from './job-runner';
import {MediaRightsExpiryHandler} from './media/rights-expiry.handler';
import {ImageVariantHandler} from './media/image-variant.handler';
import {createImageProcessor} from './media/s3-image-processor';
import {OutboxDispatcher} from './outbox-dispatcher';
import {CanonicalChangeHandler} from './projections/canonical-change.handler';
import {ProductSearchProjectionHandler} from './projections/product-search.handler';
import {SimpleContentExtractor} from './simple-extractor';

export type ProcessorContext={signal:AbortSignal};
export type Processor={key:string;tick(ctx:ProcessorContext):Promise<void>};

export class ProcessorRegistry{
 constructor(readonly processors:Processor[]){}
 async tick(ctx:ProcessorContext){
  const results=await Promise.allSettled(this.processors.map(p=>p.tick(ctx)));
  let failures=0;
  results.forEach((r,i)=>{
   if(r.status==='rejected'){
    failures++;
    console.error('processor_failed',{
     processor:this.processors[i]?.key,errorCode:errorCode(r.reason),
    });
   }
  });
  return {failures};
 }
}

export function createRuntimeProcessors(
 pool:Pool,env:NodeJS.ProcessEnv=process.env,
):Processor[] {
 const ingestion=new IngestionRunner(pool,new HttpAcquirer());
 const handlers:JobHandler[]=[
  new ProductSearchProjectionHandler(pool),
  new CanonicalChangeHandler(pool),
  new EditorialSearchProjectionHandler(pool),
  new ScheduledPublicationHandler(pool),
  new ListingCandidateHandler(pool),
  new PriceTrendProjectionHandler(pool),
  new ListingStalenessHandler(pool),
  new MediaRightsExpiryHandler(pool),
  new ImageVariantHandler(pool,createImageProcessor(env)),
  new ExtractionHandler(pool,new SimpleContentExtractor()),
  {
   type:'ingestion.run_target',
   handle:(payload:unknown)=>ingestion.runTarget(asRecord(payload).targetId as string),
  },
 ];
 const runner=new JobRunner(pool,new Map(handlers.map(handler=>[handler.type,handler])));
 const outbox=new OutboxDispatcher(pool,new DatabaseEventRouter(pool));
 const scheduler=new DurableScheduler(pool,workerRetentionDays(env.WORKER_JOB_RETENTION_DAYS));
 const schedulerIntervalMs=workerSchedulerIntervalMs(env.WORKER_SCHEDULER_INTERVAL_MS);
 let nextSchedulerAt=0;

 return [
  {key:'scheduler',async tick(){
   if(Date.now()<nextSchedulerAt)return;
   await scheduler.enqueueDue();
   nextSchedulerAt=Date.now()+schedulerIntervalMs;
  }},
  {key:'outbox',async tick(){await outbox.dispatchBatch(50);}},
  {key:'jobs',async tick(){
   await runner.recoverExpiredLeases();
   for(let processed=0;processed<25;processed++){
    if(!await runner.runOne())break;
   }
  }},
 ];
}

function asRecord(value:unknown):Record<string,unknown> {
 return value && typeof value==='object' ? value as Record<string,unknown> : {};
}

function errorCode(error:unknown) {
 return error&&typeof error==='object'&&'code' in error
  ? String(error.code).slice(0,80):'PROCESSOR_ERROR';
}
