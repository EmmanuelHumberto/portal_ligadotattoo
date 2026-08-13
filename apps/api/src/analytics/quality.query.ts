import {Inject,Injectable} from '@nestjs/common';
import {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';

@Injectable()
export class QualityQuery {
 constructor(@Inject(PG_POOL) private readonly pool:Pool){}

 async productQuality(){
  const r=await this.pool.query(
   `select
     count(*)::int products,
     count(*) filter(where public_spec_count>=5)::int with_core_specs,
     count(*) filter(where public_media_count>0)::int with_media,
     count(*) filter(where provenance_count>0)::int with_provenance,
     count(*) filter(where fresh_offer_count>0)::int with_fresh_offer
    from analytics.product_quality_projection`,
  );
  return r.rows[0];
 }

 async contentOpportunities(){
  const r=await this.pool.query(
   `select topic_key,search_sessions,result_open_rate,content_count,
           opportunity_score
      from analytics.content_opportunity_projection
     order by opportunity_score desc limit 50`,
  );
  return {items:r.rows};
 }
}
