import { Pool } from 'pg';

export type JobResult = 'DONE' | 'RETRYABLE' | 'NON_RETRYABLE';

export interface JobHandler {
  type: string;
  handle(payload: unknown): Promise<JobResult>;
}

export class JobRunner {
  constructor(
    private readonly pool: Pool,
    private readonly handlers: Map<string, JobHandler>,
  ) {}

  async recoverExpiredLeases(): Promise<number> {
    const result=await this.pool.query(
      `update ops.job
          set status='RETRY',locked_at=null,updated_at=now(),
              last_error='Recovered expired worker lease'
        where status='RUNNING'
          and locked_at < now()-interval '5 minutes'`,
    );
    return result.rowCount ?? 0;
  }

  async runOne(): Promise<boolean> {
    const c = await this.pool.connect();
    let transactionOpen=false;
    try {
      await c.query('BEGIN');
      transactionOpen=true;
      const r = await c.query(
        `select id,job_type,payload,attempts,max_attempts
           from ops.job
          where status in ('PENDING','RETRY')
            and available_at <= now()
          order by available_at
          for update skip locked
          limit 1`,
      );
      if (!r.rowCount) {
        await c.query('COMMIT');
        transactionOpen=false;
        return false;
      }

      const job = r.rows[0];
      await c.query(
        `update ops.job
            set status='RUNNING',locked_at=now(),updated_at=now()
          where id=$1`,
        [job.id],
      );
      await c.query('COMMIT');
      transactionOpen=false;

      const handler = this.handlers.get(job.job_type);
      let result:JobResult='NON_RETRYABLE';
      let error:string|null=handler ? null : `No handler for ${job.job_type}`;
      if (handler) {
        try {
          result=await handler.handle(job.payload);
        } catch (caught) {
          result='RETRYABLE';
          error=safeError(caught);
        }
      }

      const attempts = Number(job.attempts) + 1;
      if (result === 'DONE') {
        await this.pool.query(
          `update ops.job
              set status='DONE',attempts=$2,completed_at=now(),locked_at=null,
                  updated_at=now(),last_error=null
            where id=$1`,
          [job.id, attempts],
        );
      } else if (result === 'RETRYABLE' && attempts < Number(job.max_attempts)) {
        await this.pool.query(
          `update ops.job
              set status='RETRY', attempts=$2,
                  available_at=now() + (interval '1 second' * least(900, power(2,$2))),
                  locked_at=null,updated_at=now(),last_error=$3
            where id=$1`,
          [job.id, attempts,error],
        );
      } else {
        await this.pool.query(
          `update ops.job
              set status='DEAD',attempts=$2,completed_at=now(),locked_at=null,
                  updated_at=now(),last_error=$3
            where id=$1`,
          [job.id, attempts,error],
        );
      }
      return true;
    } catch (error) {
      if (transactionOpen)await c.query('ROLLBACK').catch(()=>undefined);
      throw error;
    } finally {
      c.release();
    }
  }
}

function safeError(error:unknown) {
  const message=error instanceof Error ? error.message : String(error);
  return message.replace(/(token|secret|password|key)=\S+/gi,'$1=[REDACTED]').slice(0,1000);
}
