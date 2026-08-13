import {Inject,Injectable} from '@nestjs/common';
import {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';

@Injectable()
export class FunnelQuery {
 constructor(@Inject(PG_POOL) private readonly pool:Pool){}

 async discovery(days=30){
  const r=await this.pool.query(
   `with e as (
      select anonymous_session_id,event_name
      from analytics.event
      where occurred_at>=now()-($1::text||' days')::interval
    )
    select
     count(distinct anonymous_session_id)::int sessions,
     count(distinct anonymous_session_id)
       filter(where event_name='product_open')::int product_sessions,
     count(distinct anonymous_session_id)
       filter(where event_name='compare_complete')::int compare_sessions,
     count(distinct anonymous_session_id)
       filter(where event_name='offer_open')::int offer_sessions
    from e`,[String(Math.min(Math.max(days,1),365))],
  );
  return r.rows[0];
 }

 async search(days=30){
  const r=await this.pool.query(
   `select
      count(*) filter(where event_name='search_submit')::int searches,
      count(*) filter(where event_name='search_result_open')::int result_opens,
      count(*) filter(
       where event_name='search_submit'
       and coalesce((properties->>'resultCount')::int,0)=0
      )::int zero_result_searches
    from analytics.event
    where occurred_at>=now()-($1::text||' days')::interval`,
   [String(Math.min(Math.max(days,1),365))],
  );
  return r.rows[0];
 }
}
