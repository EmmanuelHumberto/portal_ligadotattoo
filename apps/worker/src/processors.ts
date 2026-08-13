export type ProcessorContext={signal:AbortSignal};
export type Processor={key:string;tick(ctx:ProcessorContext):Promise<void>};

export class ProcessorRegistry{
 constructor(readonly processors:Processor[]){}
 async tick(ctx:ProcessorContext){
  const results=await Promise.allSettled(this.processors.map(p=>p.tick(ctx)));
  results.forEach((r,i)=>{
   if(r.status==='rejected')console.error('processor_failed',
    {processor:this.processors[i]?.key,error:String(r.reason)});
  });
 }
}

export const baselineProcessors:Processor[]=[
 {key:'outbox',async tick(){/* concrete AR outbox adapter integration point */}},
 {key:'jobs',async tick(){/* concrete durable job adapter integration point */}},
 {key:'ingestion',async tick(){/* source scheduler integration point */}},
 {key:'media',async tick(){/* variant/rights maintenance integration point */}},
];
