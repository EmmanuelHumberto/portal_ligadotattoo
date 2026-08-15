import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';
import { MEDIA_DELIVERY,MediaDeliveryPort } from '../media/media-storage.port';

@Injectable()
export class EditorialQuery {
  constructor(
    @Inject(PG_POOL) private readonly pool:Pool,
    @Inject(MEDIA_DELIVERY) private readonly delivery:MediaDeliveryPort,
  ) {}

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
    const mediaUrls=await resolveMediaUrls(this.pool,this.delivery,
      r.rows.map(x=>x.body_document));
    return {
      items:r.rows.map(x=>publicDto(x,mediaUrls)),
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
    if(!r.rowCount)return null;
    const mediaUrls=await resolveMediaUrls(this.pool,this.delivery,
      [r.rows[0].body_document]);
    return publicDto(r.rows[0],mediaUrls);
  }

  async adminList(status?:string,type?:string,limit=50) {
    const r=await this.pool.query(
      `select id,content_type,slug,title,status,origin,created_by,
              scheduled_at,published_at,version,updated_at
         from editorial.content
        where ($1::text is null or status=$1)
          and ($2::text is null or content_type=$2)
        order by updated_at desc limit $3`,
      [status ?? null,type ?? null,Math.min(Math.max(limit,1),100)],
    );
    return {items:r.rows};
  }

  async adminById(id:string) {
    const r=await this.pool.query(
      `select c.id,c.content_type,c.slug,c.title,c.subtitle,c.summary,
              c.body_document,c.status,c.origin,c.created_by,c.approved_by,
              c.scheduled_at,c.published_at,c.version,c.created_at,c.updated_at,
              e.starts_at,e.ends_at,e.timezone,e.venue_name,e.city,
              e.country_code,e.official_url,e.event_status
         from editorial.content c
         left join editorial.event_detail e on e.content_id=c.id
        where c.id=$1`,
      [id],
    );
    return r.rowCount ? adminDto(r.rows[0]) : null;
  }
}

async function resolveMediaUrls(
  pool:Pool,delivery:MediaDeliveryPort,bodies:any[],
):Promise<Record<string,string>> {
  const ids=new Set<string>();
  for(const body of bodies){
    for(const b of (body?.blocks ?? []) as any[]){
      if(b?.type==='image' && b.mediaId)ids.add(String(b.mediaId));
    }
  }
  const urls:Record<string,string>={};
  if(!ids.size)return urls;
  const r=await pool.query(
    `select id,storage_key from media.media_asset where id=any($1::uuid[])`,
    [[...ids]],
  );
  for(const row of r.rows){
    urls[row.id]=await delivery.url(row.storage_key);
  }
  return urls;
}

function publicDto(r:any,mediaUrls:Record<string,string>={}) {
  const body=r.body_document;
  let coverUrl:any=null;
  if(body?.blocks){
    body.blocks=(body.blocks as any[]).map(b=>{
      if(b?.type==='image' && b.mediaId){
        const url=mediaUrls[String(b.mediaId)];
        if(!coverUrl && url)coverUrl=url;
        return {...b,url};
      }
      return b;
    });
  }
  return {
    id:r.id,contentType:r.content_type,slug:r.slug,title:r.title,
    subtitle:r.subtitle,summary:r.summary,body,coverUrl,
    publishedAt:r.published_at,updatedAt:r.updated_at,
    event:r.content_type==='EVENT'?{
      startsAt:r.starts_at,endsAt:r.ends_at,timezone:r.timezone,
      venueName:r.venue_name,city:r.city,countryCode:r.country_code,
      officialUrl:r.official_url,status:r.event_status,
    }:null,
  };
}

function adminDto(r:any) {
  return {
    id:r.id,contentType:r.content_type,slug:r.slug,title:r.title,
    subtitle:r.subtitle,summary:r.summary,body:r.body_document,
    status:r.status,origin:r.origin,createdBy:r.created_by,
    approvedBy:r.approved_by,scheduledAt:r.scheduled_at,
    publishedAt:r.published_at,version:r.version,
    createdAt:r.created_at,updatedAt:r.updated_at,
    event:r.content_type==='EVENT'?{
      startsAt:r.starts_at,endsAt:r.ends_at,timezone:r.timezone,
      venueName:r.venue_name,city:r.city,countryCode:r.country_code,
      officialUrl:r.official_url,status:r.event_status,
    }:null,
  };
}
