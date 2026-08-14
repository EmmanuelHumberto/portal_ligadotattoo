import {createHash} from 'node:crypto';
import {request} from 'node:https';
import type {IncomingMessage} from 'node:http';
import {
  assertSafeTarget,type ResolveHost,type SafeTarget,
} from './url-policy';

export type AcquisitionResult={
  finalUrl:string;status:number;contentType:string|null;
  body:Buffer;sha256:string;
};

type Transport=(
  target:SafeTarget,timeoutMs:number,maxBytes:number,
)=>Promise<{status:number;headers:IncomingMessage['headers'];body:Buffer}>;

export class HttpAcquirer {
  constructor(
    private readonly resolveHost?:ResolveHost,
    private readonly transport:Transport=httpsRequest,
  ) {}

  async acquire(input:{
    url:string;allowedHosts:string[];maxBytes?:number;timeoutMs?:number;
  }):Promise<AcquisitionResult> {
    const maxBytes=bounded(input.maxBytes,5_000_000,1,10_000_000,'maxBytes');
    const timeoutMs=bounded(input.timeoutMs,15_000,100,60_000,'timeoutMs');
    return this.follow(
      input.url,input.allowedHosts,maxBytes,Date.now()+timeoutMs,0,
    );
  }

  private async follow(
    rawUrl:string,allowedHosts:string[],maxBytes:number,deadline:number,
    redirectCount:number,
  ):Promise<AcquisitionResult> {
    if(redirectCount>5)throw new Error('Too many redirects');
    const target=await withinDeadline(
      assertSafeTarget(rawUrl,allowedHosts,this.resolveHost),deadline,
    );
    const remainingMs=deadline-Date.now();
    if(remainingMs<=0)throw new Error('HTTP acquisition timed out');
    const response=await this.transport(target,remainingMs,maxBytes);

    if(response.status>=300&&response.status<400){
      const location=singleHeader(response.headers.location);
      if(!location)throw new Error('Redirect without location');
      const next=new URL(location,target.url);
      return this.follow(
        next.toString(),allowedHosts,maxBytes,deadline,redirectCount+1,
      );
    }
    if(response.status<200||response.status>=300)
      throw new Error(`HTTP acquisition failed: ${response.status}`);
    if(!response.body.length)throw new Error('Empty response body');

    return {
      finalUrl:target.url.toString(),status:response.status,
      contentType:singleHeader(response.headers['content-type'])??null,
      body:response.body,
      sha256:createHash('sha256').update(response.body).digest('hex'),
    };
  }
}

function httpsRequest(
  target:SafeTarget,timeoutMs:number,maxBytes:number,
):Promise<{status:number;headers:IncomingMessage['headers'];body:Buffer}> {
  return new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(error?:Error,value?:{
      status:number;headers:IncomingMessage['headers'];body:Buffer;
    })=>{
      if(settled)return;settled=true;
      if(error)reject(error);else resolve(value!);
    };
    const req=request(target.url,{
      method:'GET',servername:target.url.hostname,
      headers:{
        'user-agent':'PortalTattooBot/1.0 (+registered-source-ingestion)',
        accept:'text/html,application/json;q=0.9,*/*;q=0.1',
        'accept-encoding':'identity',
      },
      lookup:(_hostname,options,callback)=>{
        if((options as {all?:boolean})?.all){
          callback(null,target.addresses);
        } else {
          const selected=target.addresses[0]!;
          callback(null,selected.address,selected.family);
        }
      },
    },response=>{
      const encoding=singleHeader(response.headers['content-encoding']);
      if(encoding&&encoding.toLowerCase()!=='identity'){
        response.destroy();
        finish(new Error('Compressed acquisition response is not allowed'));
        return;
      }
      const length=Number(singleHeader(response.headers['content-length']));
      if(Number.isFinite(length)&&length>maxBytes){
        response.destroy();
        finish(new Error('Response exceeds acquisition limit'));
        return;
      }
      const chunks:Buffer[]=[];let size=0;
      response.on('data',(chunk:Buffer)=>{
        size+=chunk.length;
        if(size>maxBytes){
          response.destroy();
          finish(new Error('Response exceeds acquisition limit'));
        } else chunks.push(chunk);
      });
      response.on('end',()=>finish(undefined,{
        status:response.statusCode??0,headers:response.headers,
        body:Buffer.concat(chunks),
      }));
      response.on('error',(error)=>finish(error));
    });
    req.setTimeout(timeoutMs,()=>{
      req.destroy(new Error('HTTP acquisition timed out'));
    });
    req.on('error',(error)=>finish(error));
    req.end();
  });
}

function singleHeader(value:string|string[]|undefined) {
  return Array.isArray(value)?value[0]:value;
}

function bounded(
  value:number|undefined,fallback:number,min:number,max:number,key:string,
) {
  const result=value??fallback;
  if(!Number.isInteger(result)||result<min||result>max)
    throw new Error(`Invalid acquisition ${key}`);
  return result;
}

function withinDeadline<T>(operation:Promise<T>,deadline:number):Promise<T> {
  const remaining=deadline-Date.now();
  if(remaining<=0)return Promise.reject(new Error('HTTP acquisition timed out'));
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(
      ()=>reject(new Error('HTTP acquisition timed out')),remaining,
    );
    operation.then(
      value=>{clearTimeout(timer);resolve(value);},
      error=>{clearTimeout(timer);reject(error);},
    );
  });
}
