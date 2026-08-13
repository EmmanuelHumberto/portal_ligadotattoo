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

  async runOne(): Promise<boolean> {
    const c = await this.pool.connect();
    try {
      await c.query('BEGIN');
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
        return false;
      }

      const job = r.rows[0];
      await c.query(
        `update ops.job set status='RUNNING', locked_at=now() where id=$1`,
        [job.id],
      );
      await c.query('COMMIT');

      const handler = this.handlers.get(job.job_type);
      const result: JobResult = handler
        ? await handler.handle(job.payload)
        : 'NON_RETRYABLE';

      const attempts = Number(job.attempts) + 1;
      if (result === 'DONE') {
        await this.pool.query(
          `update ops.job set status='DONE', attempts=$2, completed_at=now() where id=$1`,
          [job.id, attempts],
        );
      } else if (result === 'RETRYABLE' && attempts < Number(job.max_attempts)) {
        await this.pool.query(
          `update ops.job
              set status='RETRY', attempts=$2,
                  available_at=now() + (interval '1 second' * least(900, power(2,$2)))
            where id=$1`,
          [job.id, attempts],
        );
      } else {
        await this.pool.query(
          `update ops.job set status='DEAD', attempts=$2, completed_at=now() where id=$1`,
          [job.id, attempts],
        );
      }
      return true;
    } finally {
      c.release();
    }
  }
}
