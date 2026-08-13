import type {AiProvider} from './ai-provider.port';
import type {AiNormalizedResult,AiWorkloadRequest} from '@portal/contracts';

export type HttpProviderConfig={
 key:string;apiKey:string;baseUrl:string;defaultModel:string;
 headers?:(key:string)=>Record<string,string>;
 body:(input:AiWorkloadRequest,model:string)=>unknown;
 parse:(json:any)=>string;
};

export class HttpAiProvider implements AiProvider{
 readonly key:string;
 constructor(private readonly cfg:HttpProviderConfig){this.key=cfg.key;}
 async execute(input:AiWorkloadRequest,model=this.cfg.defaultModel):Promise<AiNormalizedResult>{
  const started=Date.now();
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),30000);
  try{
   const r=await fetch(this.cfg.baseUrl,{
    method:'POST',signal:controller.signal,
    headers:{'content-type':'application/json',
     ...(this.cfg.headers?.(this.cfg.apiKey)??{authorization:`Bearer ${this.cfg.apiKey}`})},
    body:JSON.stringify(this.cfg.body(input,model)),
   });
   if(!r.ok)throw new Error(`${this.key}_HTTP_${r.status}`);
   const json=await r.json();
   return {provider:this.key,model,text:this.cfg.parse(json),latencyMs:Date.now()-started};
  }finally{clearTimeout(timeout)}
 }
}
