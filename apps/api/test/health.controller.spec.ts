import {describe,expect,it,vi} from 'vitest';
import {HealthController} from '../src/health.controller';

describe('health endpoints',()=>{
  it('keeps liveness independent from dependencies',()=>{
    const controller=new HealthController({} as any);
    expect(controller.live()).toEqual({status:'UP',service:'api'});
  });

  it('returns 503 when database readiness is DOWN',async()=>{
    const database={check:vi.fn().mockResolvedValue({
      name:'database',status:'DOWN',latencyMs:1,
      reason:'CONNECTION_UNAVAILABLE',
    })};
    const response={status:vi.fn()};
    const result=await new HealthController(database as any)
      .ready(response as any);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(result.status).toBe('DOWN');
  });

  it('returns 200 when database and schema are ready',async()=>{
    const database={check:vi.fn().mockResolvedValue({
      name:'database',status:'UP',latencyMs:1,
    })};
    const response={status:vi.fn()};
    const result=await new HealthController(database as any)
      .ready(response as any);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(result.status).toBe('UP');
  });
});
