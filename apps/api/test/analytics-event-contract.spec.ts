import {BadRequestException} from '@nestjs/common';
import {describe,expect,it} from 'vitest';
import {sanitizeEvent} from '../src/analytics/event-contract';

describe('analytics event contract',()=>{
  it('keeps only allow-listed primitive properties',()=>{
    expect(sanitizeEvent({name:'product_open',anonymousSessionId:'session-1',
      properties:{productId:'p1',routeClass:'catalog',email:'private',nested:{x:1}}}))
      .toMatchObject({name:'product_open',anonymousSessionId:'session-1',
        properties:{productId:'p1',routeClass:'catalog'}});
  });
  it('rejects unknown events, sessions and invalid timestamps',()=>{
    expect(()=>sanitizeEvent({name:'custom',anonymousSessionId:'s'}))
      .toThrow(BadRequestException);
    expect(()=>sanitizeEvent({name:'page_view',anonymousSessionId:'bad session'}))
      .toThrow(BadRequestException);
    expect(()=>sanitizeEvent({name:'page_view',anonymousSessionId:'s',occurredAt:'never'}))
      .toThrow(BadRequestException);
  });
});
