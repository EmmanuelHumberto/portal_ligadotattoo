import {Inject,Injectable,OnApplicationShutdown} from '@nestjs/common';
import type {Pool} from 'pg';
import {PG_POOL} from './tokens';

@Injectable()
export class DatabaseLifecycleService implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool:Pick<Pool,'end'>) {}

  async onApplicationShutdown(){await this.pool.end();}
}
