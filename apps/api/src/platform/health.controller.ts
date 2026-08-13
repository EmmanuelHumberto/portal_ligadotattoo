import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from './database.module';

@Controller()
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  @Get('livez')
  live() {
    return { status: 'ok' };
  }

  @Get('readyz')
  async ready() {
    try {
      await this.pool.query('select 1');
      return { status: 'ready', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException('database unavailable');
    }
  }
}
