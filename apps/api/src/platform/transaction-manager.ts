import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { PG_POOL } from './tokens';

export type Tx = PoolClient;

@Injectable()
export class TransactionManager {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async run<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    const tx = await this.pool.connect();
    try {
      await tx.query('BEGIN');
      const result = await fn(tx);
      await tx.query('COMMIT');
      return result;
    } catch (error) {
      await tx.query('ROLLBACK');
      throw error;
    } finally {
      tx.release();
    }
  }
}
