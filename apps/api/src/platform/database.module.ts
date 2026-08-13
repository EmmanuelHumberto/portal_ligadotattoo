import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { TransactionManager } from './transaction-manager';
import {DatabaseReadinessService} from './database-readiness.service';
import {DatabaseLifecycleService} from './database-lifecycle.service';
import {
  databaseConnectionTimeoutMs,databaseReadinessTimeoutMs,
  databasePoolMax,
} from './runtime-config';
import { PG_POOL } from './tokens';

export { PG_POOL } from './tokens';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => createDatabasePool(process.env),
    },
    {
      provide:DatabaseReadinessService,
      useFactory:(pool:Pool)=>new DatabaseReadinessService(
        pool,databaseReadinessTimeoutMs(process.env.DB_READINESS_TIMEOUT_MS),
      ),
      inject:[PG_POOL],
    },
    TransactionManager,DatabaseLifecycleService,
  ],
  exports: [PG_POOL, TransactionManager, DatabaseReadinessService],
})
export class DatabaseModule {}

export function createDatabasePool(env:NodeJS.ProcessEnv) {
  const pool=new Pool({
    connectionString:env.DATABASE_URL,
    max:databasePoolMax(env.DB_POOL_MAX),
    connectionTimeoutMillis:databaseConnectionTimeoutMs(
      env.DB_CONNECTION_TIMEOUT_MS,
    ),
  });
  pool.on('error',(error:NodeJS.ErrnoException)=>{
    console.error('database_pool_error',{code:error.code??'UNKNOWN'});
  });
  return pool;
}
