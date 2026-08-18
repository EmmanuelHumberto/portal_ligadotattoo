import {Inject,Injectable,NotFoundException} from '@nestjs/common';
import type {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';

@Injectable()
export class SetListingUrlHandler{
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async execute(id:string,url:string){
    const result=await this.pool.query(
      `update commerce.listing
          set url=$2,updated_at=now(),version=version+1
        where id=$1 returning id,url`,[id,url],
    );
    if(!result.rowCount)throw new NotFoundException('Listing not found');
    return result.rows[0];
  }
}
