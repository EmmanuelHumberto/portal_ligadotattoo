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

  it('bounds database connection and readiness timeouts',()=>{
    const config=validateRuntimeConfig({
      DATABASE_URL:databaseUrl,DB_CONNECTION_TIMEOUT_MS:'3000',
      DB_READINESS_TIMEOUT_MS:'750',
    });
    expect(config.dbConnectionTimeoutMs).toBe(3000);
    expect(config.dbReadinessTimeoutMs).toBe(750);
    expect(()=>validateRuntimeConfig({
      DATABASE_URL:databaseUrl,DB_READINESS_TIMEOUT_MS:'0',
    })).toThrow(/DB_READINESS_TIMEOUT_MS/);
  });

  it('bounds the database pool size',()=>{
    expect(validateRuntimeConfig({
      DATABASE_URL:databaseUrl,DB_POOL_MAX:'20',
    }).dbPoolMax).toBe(20);
    expect(()=>validateRuntimeConfig({
      DATABASE_URL:databaseUrl,DB_POOL_MAX:'0',
    })).toThrow(/DB_POOL_MAX/);
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
