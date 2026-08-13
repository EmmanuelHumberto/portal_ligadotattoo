import { createHash } from 'node:crypto';
import { assertSafeTarget } from './url-policy';

export type AcquisitionResult = {
  finalUrl:string;
  status:number;
  contentType:string|null;
  body:Buffer;
  sha256:string;
};

export class HttpAcquirer {
  async acquire(input:{
    url:string;allowedHosts:string[];maxBytes?:number;
  }):Promise<AcquisitionResult> {
    const maxBytes=Math.min(input.maxBytes ?? 5_000_000,10_000_000);
    const target=await assertSafeTarget(input.url,input.allowedHosts);

    const response=await fetch(target,{
      redirect:'manual',
      headers:{
        'user-agent':'PortalTattooBot/1.0 (+registered-source-ingestion)',
        'accept':'text/html,application/json;q=0.9,*/*;q=0.1',
      },
      signal:AbortSignal.timeout(15_000),
    });

    // Redirects must be revalidated rather than automatically followed.
    if (response.status >= 300 && response.status < 400) {
      const location=response.headers.get('location');
      if (!location) throw new Error('Redirect without location');
      const next=new URL(location,target);
      await assertSafeTarget(next.toString(),input.allowedHosts);
      return this.acquire({...input,url:next.toString()});
    }

    if (!response.ok) throw new Error(`HTTP acquisition failed: ${response.status}`);

    const reader=response.body?.getReader();
    if (!reader) throw new Error('Empty response body');
    const chunks:Uint8Array[]=[];
    let size=0;
    while (true) {
      const {done,value}=await reader.read();
      if (done) break;
      size+=value.byteLength;
      if (size>maxBytes) throw new Error('Response exceeds acquisition limit');
      chunks.push(value);
    }
    const body=Buffer.concat(chunks);
    return {
      finalUrl:target.toString(),
      status:response.status,
      contentType:response.headers.get('content-type'),
      body,
      sha256:createHash('sha256').update(body).digest('hex'),
    };
  }
}
