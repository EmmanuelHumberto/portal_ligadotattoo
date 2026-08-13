import {describe,expect,it} from 'vitest';
import {
  workerHeartbeatCheck,
} from '../src/ops/readiness.service';
import {workerHeartbeatStaleSeconds} from '../src/platform/runtime-config';

describe('worker operational readiness',()=>{
  it('is UP with a recently completed worker loop',()=>{
    expect(workerHeartbeatCheck({
      active:1,starting:0,stale:0,last_completed_at:'2026-08-12T00:00:00Z',
    },120)).toEqual({
      name:'worker_heartbeat',status:'UP',active:1,starting:0,stale:0,
      lastCompletedAt:'2026-08-12T00:00:00Z',staleAfterSeconds:120,
    });
  });

  it('allows a bounded startup grace period',()=>{
    expect(workerHeartbeatCheck({active:0,starting:1,stale:0},120).status)
      .toBe('UP');
  });

  it('is DEGRADED without a fresh worker loop',()=>{
    expect(workerHeartbeatCheck({active:0,starting:0,stale:2},120))
      .toMatchObject({status:'DEGRADED',stale:2});
  });

  it('bounds the stale threshold',()=>{
    expect(workerHeartbeatStaleSeconds(undefined)).toBe(120);
    expect(workerHeartbeatStaleSeconds('30')).toBe(30);
    expect(()=>workerHeartbeatStaleSeconds('29')).toThrow();
    expect(()=>workerHeartbeatStaleSeconds('901')).toThrow();
  });
});
