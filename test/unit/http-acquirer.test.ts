import {describe,expect,it,vi} from 'vitest';
import {gzipSync} from 'node:zlib';
import {
  decodeBody,HttpAcquirer,
} from '../../apps/worker/src/ingestion/http-acquirer';
import type {ResolveHost} from '../../apps/worker/src/ingestion/url-policy';

const resolvePublic:ResolveHost=async()=>[{address:'8.8.8.8',family:4}];

describe('safe HTTP acquirer',()=>{
  it('pins the validated DNS answer and hashes the bounded response',async()=>{
    const transport=vi.fn(async(target)=>({
      status:200,headers:{'content-type':'text/html'},body:Buffer.from('ok'),
      target,
    }));
    const result=await new HttpAcquirer(resolvePublic,transport).acquire({
      url:'https://allowed.example/a',allowedHosts:['allowed.example'],
    });
    expect(transport.mock.calls[0]?.[0].addresses).toEqual([
      {address:'8.8.8.8',family:4},
    ]);
    expect(result).toMatchObject({
      finalUrl:'https://allowed.example/a',status:200,contentType:'text/html',
      body:Buffer.from('ok'),
    });
    expect(result.sha256).toHaveLength(64);
  });

  it('revalidates redirects and blocks a redirect outside the allowlist',async()=>{
    const transport=vi.fn(async()=>({
      status:302,headers:{location:'https://evil.example/private'},body:Buffer.alloc(0),
    }));
    await expect(new HttpAcquirer(resolvePublic,transport).acquire({
      url:'https://allowed.example/a',allowedHosts:['allowed.example'],
    })).rejects.toThrow(/not registered/);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty final response',async()=>{
    const transport=vi.fn(async()=>({
      status:200,headers:{},body:Buffer.alloc(0),
    }));
    await expect(new HttpAcquirer(resolvePublic,transport).acquire({
      url:'https://allowed.example/empty',allowedHosts:['allowed.example'],
    })).rejects.toThrow(/Empty response body/);
  });

  it('bounds redirects and acquisition configuration',async()=>{
    const transport=vi.fn(async()=>({
      status:302,headers:{location:'/loop'},body:Buffer.alloc(0),
    }));
    await expect(new HttpAcquirer(resolvePublic,transport).acquire({
      url:'https://allowed.example/loop',allowedHosts:['allowed.example'],
    })).rejects.toThrow(/Too many redirects/);
    expect(transport).toHaveBeenCalledTimes(6);
    await expect(new HttpAcquirer(resolvePublic,transport).acquire({
      url:'https://allowed.example',allowedHosts:['allowed.example'],maxBytes:0,
    })).rejects.toThrow(/Invalid acquisition maxBytes/);
  });

  it('shares one deadline across the complete redirect chain',async()=>{
    const realNow=Date.now;
    let now=1_000;
    Date.now=()=>now;
    const observedTimeouts:number[]=[];
    const transport=vi.fn(async(_target,timeoutMs:number)=>{
      observedTimeouts.push(timeoutMs);
      now+=60;
      return {status:302,headers:{location:'/next'},body:Buffer.alloc(0)};
    });
    try {
      await expect(new HttpAcquirer(resolvePublic,transport).acquire({
        url:'https://allowed.example/start',allowedHosts:['allowed.example'],
        timeoutMs:100,
      })).rejects.toThrow(/timed out/);
      expect(observedTimeouts).toEqual([100,40]);
    } finally {Date.now=realNow;}
  });

  it('includes DNS resolution in the acquisition deadline',async()=>{
    const stalledDns:ResolveHost=()=>new Promise(()=>{});
    await expect(new HttpAcquirer(stalledDns).acquire({
      url:'https://allowed.example',allowedHosts:['allowed.example'],
      timeoutMs:100,
    })).rejects.toThrow(/timed out/);
  });

  it('bounds decompressed responses and rejects malformed encodings',()=>{
    const compressed=gzipSync(Buffer.alloc(20_000,65));
    expect(()=>decodeBody(compressed,'gzip',1_000))
      .toThrow(/larger than|exceeds|Cannot create a Buffer/i);
    expect(()=>decodeBody(Buffer.from('not-gzip'),'gzip',1_000)).toThrow();
    expect(()=>decodeBody(Buffer.from('ok'),'compress',1_000))
      .toThrow(/Unsupported content encoding/);
  });
});
