import { Pool } from 'pg';

export class EditorialSearchProjectionHandler {
  readonly type='projection.editorial_search';
  constructor(private readonly pool:Pool) {}

  async handle(payload:any) {
    const r=await this.pool.query(
      `select id,content_type,slug,title,summary,status
         from editorial.content where id=$1`,
      [payload.contentId],
    );
    if (!r.rowCount || r.rows[0].status !== 'PUBLISHED') {
      await this.pool.query(
        `delete from search.search_document
          where source_type='EDITORIAL_CONTENT' and source_id=$1`,
        [payload.contentId],
      );
      return 'DONE' as const;
    }
    const e=r.rows[0];
    const base =
      e.content_type==='NEWS' ? '/noticias/' :
      e.content_type==='EVENT' ? '/eventos/' : '/blog/';

    await this.pool.query(
      `insert into search.search_document
       (id,source_type,source_id,document_type,title,normalized_title,
        subtitle,public_url,is_public,search_vector,updated_at)
       values ($1,'EDITORIAL_CONTENT',$1,$2,$3,lower($3),$4,$5,true,
         setweight(to_tsvector('simple',coalesce($3,'')),'A') ||
         setweight(to_tsvector('simple',coalesce($4,'')),'B'),now())
       on conflict (source_type,source_id)
       do update set document_type=excluded.document_type,
                     title=excluded.title,
                     normalized_title=excluded.normalized_title,
                     subtitle=excluded.subtitle,
                     public_url=excluded.public_url,
                     is_public=true,
                     search_vector=excluded.search_vector,
                     updated_at=now()`,
      [e.id,e.content_type,e.title,e.summary,base+e.slug],
    );
    return 'DONE' as const;
  }
}
