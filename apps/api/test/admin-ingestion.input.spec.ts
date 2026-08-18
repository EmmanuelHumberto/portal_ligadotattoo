import {BadRequestException} from '@nestjs/common';
import {describe,expect,it} from 'vitest';
import {
  crawlTargetInput,discoveryStatus,ingestionRunStatus,sourceInput,sourceKindFilter,
} from '../src/ingestion/admin-ingestion.input';

const sourceId='8e6fda3a-1984-4d9f-9e2c-7b77ac613c5c';

describe('admin ingestion runtime input',()=>{
  it('normalizes sources, targets and filters',()=>{
    expect(sourceInput({name:' Fabricante ',kind:'manufacturer',
      baseUrl:'https://Example.com/catalog#top',allowedHosts:['CDN.example.com']}))
      .toEqual({name:'Fabricante',kind:'MANUFACTURER',
        baseUrl:'https://example.com/catalog',allowedHosts:['cdn.example.com'],
        robotsPolicy:'RESPECT',crawlDelayMs:1000});
    expect(crawlTargetInput({sourceId,url:'https://example.com/products',
      discoveryMode:'catalog'})).toEqual({sourceId,url:'https://example.com/products',
      discoveryMode:'CATALOG',scheduleKey:null,maxBytes:5_000_000});
    expect(sourceKindFilter(' news ')).toBe('NEWS');
    expect(ingestionRunStatus('failed')).toBe('FAILED');
    expect(discoveryStatus(undefined)).toBe('NEW');
  });

  it('rejects unsafe URLs, invalid identifiers and unbounded limits',()=>{
    expect(()=>sourceInput({name:'Fonte',kind:'NEWS',baseUrl:'http://example.com'}))
      .toThrow(BadRequestException);
    expect(()=>crawlTargetInput({sourceId:'bad',url:'https://example.com'}))
      .toThrow(BadRequestException);
    expect(()=>crawlTargetInput({sourceId,url:'https://user:pass@example.com'}))
      .toThrow(BadRequestException);
    expect(()=>sourceInput({name:'Fonte',kind:'NEWS',baseUrl:'https://example.com',
      crawlDelayMs:10})).toThrow(BadRequestException);
  });
});
