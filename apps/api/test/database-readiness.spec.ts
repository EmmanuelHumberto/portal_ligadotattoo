import {describe,expect,it,vi} from 'vitest';
import {DatabaseReadinessService} from '../src/platform/database-readiness.service';

describe('database readiness',()=>{
  it('is UP only when connectivity and critical schema are available',async()=>{
    const pool={query:vi.fn().mockResolvedValue({rows:[{
      catalog_ready:true,outbox_ready:true,
    }]})};
    const check=await new DatabaseReadinessService(pool as any,750).check();
    expect(check).toMatchObject({name:'database',status:'UP'});
    expect(pool.query).toHaveBeenCalledWith(expect.objectContaining({
      query_timeout:750,
    }));
  });

  it('is DOWN when migrations have not created critical relations',async()=>{
    const pool={query:vi.fn().mockResolvedValue({rows:[{
      catalog_ready:true,outbox_ready:false,
    }]})};
    await expect(new DatabaseReadinessService(pool as any,750).check())
      .resolves.toMatchObject({status:'DOWN',reason:'SCHEMA_NOT_READY'});
  });

  it('is DOWN without leaking database errors',async()=>{
    const pool={query:vi.fn().mockRejectedValue(new Error('password secret'))};
    const check=await new DatabaseReadinessService(pool as any,750).check();
    expect(check).toMatchObject({
      status:'DOWN',reason:'CONNECTION_UNAVAILABLE',
    });
    expect(JSON.stringify(check)).not.toContain('password secret');
  });
});
