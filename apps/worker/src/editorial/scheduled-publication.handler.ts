import { Pool } from 'pg';

export class ScheduledPublicationHandler {
  readonly type='editorial.publish_scheduled';
  constructor(private readonly pool:Pool) {}

  async handle(payload:any) {
    const r=await this.pool.query(
      `update editorial.content
          set status='PUBLISHED',published_at=coalesce(published_at,now()),
              updated_at=now(),version=version+1
        where id=$1 and status='SCHEDULED' and scheduled_at <= now()
        returning id,slug,content_type`,
      [payload.contentId],
    );
    if (!r.rowCount) return 'DONE' as const;

    const row=r.rows[0];
    await this.pool.query(
      `insert into ops.outbox_event
       (id,event_type,event_version,aggregate_type,aggregate_id,
        occurred_at,payload,status,attempts,available_at)
       values (gen_random_uuid(),'editorial.content_published',1,
               'EditorialContent',$1,now(),$2::jsonb,'PENDING',0,now())`,
      [row.id,JSON.stringify({slug:row.slug,contentType:row.content_type})],
    );
    return 'DONE' as const;
  }
}
