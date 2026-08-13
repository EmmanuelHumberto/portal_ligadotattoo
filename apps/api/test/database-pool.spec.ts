import {afterEach,describe,expect,it,vi} from 'vitest';
import {createDatabasePool} from '../src/platform/database.module';

describe('database pool failure handling',()=>{
  afterEach(()=>vi.restoreAllMocks());

  it('handles idle connection errors without leaking their message',async()=>{
    const logged=vi.spyOn(console,'error').mockImplementation(()=>{});
    const pool=createDatabasePool({
      DATABASE_URL:'postgres://portal:secret@127.0.0.1:1/portal',
      DB_CONNECTION_TIMEOUT_MS:'100',
    });
    pool.emit('error',Object.assign(new Error('password secret'),{code:'ECONNRESET'}));
    expect(logged).toHaveBeenCalledWith('database_pool_error',{
      code:'ECONNRESET',
    });
    expect(JSON.stringify(logged.mock.calls)).not.toContain('password secret');
    await pool.end();
  });
});
