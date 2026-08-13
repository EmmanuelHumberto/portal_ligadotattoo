import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {afterAll,describe,expect,it} from 'vitest';
import {WorkerHeartbeat} from '../../apps/worker/src/worker-heartbeat';

const databaseUrl=process.env.TEST_DATABASE_URL;
const integration=databaseUrl?describe:describe.skip;

integration('worker heartbeat persistence',()=>{
  const pool=new Pool({connectionString:databaseUrl});
  const instanceId=randomUUID();

  afterAll(async()=>{
    await pool.query('delete from ops.worker_heartbeat where instance_id=$1',[instanceId]);
    await pool.end();
  });

  it('proves a worker loop completed and then stopped',async()=>{
    const heartbeat=new WorkerHeartbeat(pool,instanceId,3);
    await heartbeat.start();
    await heartbeat.tickStarted();
    await heartbeat.tickCompleted(0);
    let row=(await pool.query(
      `select status,last_tick_completed_at,last_tick_failures
         from ops.worker_heartbeat where instance_id=$1`,[instanceId],
    )).rows[0];
    expect(row.status).toBe('RUNNING');
    expect(row.last_tick_completed_at).toBeTruthy();
    expect(row.last_tick_failures).toBe(0);
    await heartbeat.stop();
    row=(await pool.query(
      'select status,stopped_at from ops.worker_heartbeat where instance_id=$1',
      [instanceId],
    )).rows[0];
    expect(row.status).toBe('STOPPED');
    expect(row.stopped_at).toBeTruthy();
  });
});
