import type {Pool} from 'pg';

export class WorkerHeartbeat {
  private tickStartedAt=0;

  constructor(
    private readonly pool:Pick<Pool,'query'>,
    readonly instanceId:string,
    private readonly processorCount:number,
  ) {
    if(processorCount<1)throw new Error('Worker requires at least one processor');
  }

  async start(){
    await this.pool.query(
      `insert into ops.worker_heartbeat
       (instance_id,status,processor_count,started_at,last_seen_at)
       values ($1,'STARTING',$2,now(),now())`,
      [this.instanceId,this.processorCount],
    );
    await this.pool.query(
      `delete from ops.worker_heartbeat
        where (status='STOPPED' and stopped_at<now()-interval '7 days')
           or last_seen_at<now()-interval '30 days'`,
    );
  }

  async tickStarted(){
    this.tickStartedAt=Date.now();
    await this.pool.query(
      `update ops.worker_heartbeat
          set last_seen_at=now(),last_tick_started_at=now()
        where instance_id=$1`,
      [this.instanceId],
    );
  }

  async tickCompleted(failures:number){
    const duration=Math.max(0,Date.now()-this.tickStartedAt);
    await this.pool.query(
      `update ops.worker_heartbeat
          set status='RUNNING',last_seen_at=now(),last_tick_completed_at=now(),
              last_tick_duration_ms=$2,last_tick_failures=$3
        where instance_id=$1`,
      [this.instanceId,duration,failures],
    );
  }

  async stop(){
    await this.pool.query(
      `update ops.worker_heartbeat
          set status='STOPPED',last_seen_at=now(),stopped_at=now()
        where instance_id=$1`,
      [this.instanceId],
    );
  }
}
