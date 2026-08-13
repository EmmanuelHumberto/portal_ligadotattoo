import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class PublicSearchQuery {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async search(q:string, limit=24, cursor?:string) {
    const normalized = q.trim();
    if (!normalized) return { items:[], meta:{ hasMore:false, nextCursor:null } };
    const safeLimit = Math.min(Math.max(limit,1),100);

    const params:any[] = [normalized, safeLimit + 1];
    let cursorClause = '';
    if (cursor) {
      params.push(cursor);
      cursorClause = `and d.id > $3::uuid`;
    }

    const r = await this.pool.query(
      `select d.id,d.document_type,d.title,d.subtitle,d.public_url,
              ts_rank(d.search_vector, websearch_to_tsquery('simple',$1)) rank
         from search.search_document d
        where d.is_public=true
          and d.search_vector @@ websearch_to_tsquery('simple',$1)
          ${cursorClause}
        order by rank desc,d.id
        limit $2`,
      params,
    );
    const hasMore = r.rows.length > safeLimit;
    const rows = r.rows.slice(0,safeLimit);
    return {
      items:rows.map(x => ({
        type:x.document_type,id:x.id,title:x.title,
        subtitle:x.subtitle,url:x.public_url,
      })),
      meta:{ hasMore,nextCursor:hasMore ? rows.at(-1)?.id ?? null : null },
    };
  }

  async suggest(q:string) {
    if (q.trim().length < 2) return { items:[] };
    const r = await this.pool.query(
      `select id,document_type,title,public_url
         from search.search_document
        where is_public=true and normalized_title like lower($1) || '%'
        order by popularity_score desc,title
        limit 8`,
      [q.trim()],
    );
    return {items:r.rows.map(x=>({
      id:x.id,type:x.document_type,title:x.title,url:x.public_url,
    }))};
  }
}
