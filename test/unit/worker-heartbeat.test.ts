import {describe,expect,it,vi} from 'vitest';
import {ProcessorRegistry} from '../../apps/worker/src/processors';
import {WorkerHeartbeat} from '../../apps/worker/src/worker-heartbeat';

describe('worker heartbeat',()=>{
  it('records start, completed tick metrics and graceful stop',async()=>{
    const pool={query:vi.fn().mockResolvedValue({rows:[]})};
    const heartbeat=new WorkerHeartbeat(pool as any,'instance-id',3);
    await heartbeat.start();
    await heartbeat.tickStarted();
    await heartbeat.tickCompleted(1);
    await heartbeat.stop();
    expect(pool.query).toHaveBeenCalledTimes(5);
    expect(pool.query.mock.calls[3]?.[1]).toEqual([
      'instance-id',expect.any(Number),1,
    ]);
  });

  it('reports processor failures without throwing the whole tick',async()=>{
    const logged=vi.spyOn(console,'error').mockImplementation(()=>{});
    const registry=new ProcessorRegistry([
      {key:'healthy',tick:vi.fn().mockResolvedValue(undefined)},
      {key:'failed',tick:vi.fn().mockRejectedValue(new Error('secret value'))},
    ]);
    await expect(registry.tick({signal:new AbortController().signal}))
      .resolves.toEqual({failures:1});
    expect(JSON.stringify(logged.mock.calls)).not.toContain('secret value');
    logged.mockRestore();
  });

});
