import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class EditorialQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool) {}

  async publicList(type?:string,limit=24) {
    const r=await this.pool.query(
      `select c.id,c.content_type,c.slug,c.title,c.subtitle,c.summary,
              c.body_document,c.published_at,c.updated_at,
              e.starts_at,e.ends_at,e.timezone,e.venue_name,e.city,
              e.country_code,e.official_url,e.event_status
         from editorial.content c
         left join editorial.event_detail e on e.content_id=c.id
        where c.status='PUBLISHED'
          and ($1::text is null or c.content_type=$1)
        order by c.published_at desc
        limit $2`,
      [type ?? null,Math.min(Math.max(limit,1),100)],
    );
    return {
      items:r.rows.map(publicDto),
      meta:{hasMore:false,nextCursor:null},
    };
  }

  async publicBySlug(slug:string) {
    const r=await this.pool.query(
      `select c.id,c.content_type,c.slug,c.title,c.subtitle,c.summary,
              c.body_document,c.published_at,c.updated_at,
              e.starts_at,e.ends_at,e.timezone,e.venue_name,e.city,
              e.country_code,e.official_url,e.event_status
         from editorial.content c
         left join editorial.event_detail e on e.content_id=c.id
        where c.slug=$1 and c.status='PUBLISHED'`,
      [slug],
    );
    return r.rowCount ? publicDto(r.rows[0]) : null;
  }

  async adminList(status?:string,limit=50) {
    const r=await this.pool.query(
      `select id,content_type,slug,title,status,origin,created_by,
              scheduled_at,published_at,version,updated_at
         from editorial.content
        where ($1::text is null or status=$1)
        order by updated_at desc limit $2`,
      [status ?? null,Math.min(Math.max(limit,1),100)],
    );
    return {items:r.rows};
  }
}

function publicDto(r:any) {
  return {
    id:r.id,contentType:r.content_type,slug:r.slug,title:r.title,
    subtitle:r.subtitle,summary:r.summary,body:r.body_document,
    publishedAt:r.published_at,updatedAt:r.updated_at,
    event:r.content_type==='EVENT'?{
      startsAt:r.starts_at,endsAt:r.ends_at,timezone:r.timezone,
      venueName:r.venue_name,city:r.city,countryCode:r.country_code,
      officialUrl:r.official_url,status:r.event_status,
    }:null,
  };
}
