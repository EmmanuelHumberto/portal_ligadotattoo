import {describe,expect,it,vi} from 'vitest';
import {DatabaseLifecycleService} from '../src/platform/database-lifecycle.service';

describe('database lifecycle',()=>{
  it('closes the pool during graceful application shutdown',async()=>{
    const pool={end:vi.fn().mockResolvedValue(undefined)};
    await new DatabaseLifecycleService(pool).onApplicationShutdown();
    expect(pool.end).toHaveBeenCalledOnce();
  });
});
