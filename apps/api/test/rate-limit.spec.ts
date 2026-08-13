import {describe,expect,it} from 'vitest';
import {
  FixedWindowRateLimiter,routeRateClass,
} from '../src/security/rate-limit.guard';

describe('HTTP rate limiting',()=>{
  it('classifies security-sensitive routes before generic routes',()=>{
    expect(routeRateClass('POST','/admin/media/upload')).toBe('upload');
    expect(routeRateClass('GET','/public/search?q=pen')).toBe('search');
    expect(routeRateClass('GET','/go/listing/id')).toBe('redirect');
    expect(routeRateClass('GET','/admin/audit')).toBe('admin_read');
    expect(routeRateClass('POST','/admin/editorial')).toBe('admin_write');
    expect(routeRateClass('GET','/public/products')).toBe('public_read');
  });

  it('rejects excess and opens a new window after reset',()=>{
    let now=1_000;
    const limiter=new FixedWindowRateLimiter(10,()=>now);
    expect(limiter.consume('client',1_000,2)).toMatchObject({
      allowed:true,remaining:1,
    });
    expect(limiter.consume('client',1_000,2)).toMatchObject({
      allowed:true,remaining:0,
    });
    expect(limiter.consume('client',1_000,2).allowed).toBe(false);
    now=2_000;
    expect(limiter.consume('client',1_000,2)).toMatchObject({
      allowed:true,remaining:1,
    });
  });

  it('fails closed when the bounded bucket store is exhausted',()=>{
    const limiter=new FixedWindowRateLimiter(1,()=>1_000);
    expect(limiter.consume('first',60_000,10).allowed).toBe(true);
    expect(limiter.consume('second',60_000,10).allowed).toBe(false);
  });
});
