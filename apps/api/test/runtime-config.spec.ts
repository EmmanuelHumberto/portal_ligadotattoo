import {describe,expect,it} from 'vitest';
import {validateRuntimeConfig} from '../src/platform/runtime-config';

const databaseUrl='postgres://portal:secret@localhost:5432/portal';

describe('runtime security configuration',()=>{
  it('does not trust forwarded addresses by default',()=>{
    expect(validateRuntimeConfig({DATABASE_URL:databaseUrl}).trustProxyHops)
      .toBe(0);
  });

  it('accepts a bounded trusted proxy hop count',()=>{
    expect(validateRuntimeConfig({
      DATABASE_URL:databaseUrl,TRUST_PROXY_HOPS:'2',
    }).trustProxyHops).toBe(2);
    expect(()=>validateRuntimeConfig({
      DATABASE_URL:databaseUrl,TRUST_PROXY_HOPS:'4',
    })).toThrow(/Invalid TRUST_PROXY_HOPS/);
  });

  it('requires independent session and rate-limit secrets in production',()=>{
    const production={
      NODE_ENV:'production',DATABASE_URL:databaseUrl,
      SESSION_SIGNING_SECRET:'s'.repeat(32),
    };
    expect(()=>validateRuntimeConfig(production)).toThrow(/RATE_LIMIT_HASH_SALT/);
    expect(validateRuntimeConfig({
      ...production,RATE_LIMIT_HASH_SALT:'r'.repeat(32),
    }).nodeEnv).toBe('production');
  });
});
