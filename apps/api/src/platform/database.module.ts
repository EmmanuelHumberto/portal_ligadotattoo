import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { TransactionManager } from './transaction-manager';
import { PG_POOL } from './tokens';

export { PG_POOL } from './tokens';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => new Pool({
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.DB_POOL_MAX ?? 10),
      }),
    },
    TransactionManager,
  ],
  exports: [PG_POOL, TransactionManager],
})
export class DatabaseModule {}
