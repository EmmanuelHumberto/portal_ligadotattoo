import { Injectable } from '@nestjs/common';
import type { Tx } from '../platform/transaction-manager';
import { EditorialContent } from './editorial.domain';

@Injectable()
export class EditorialRepository {
  async insert(e:EditorialContent,createdBy:string,tx:Tx) {
    await tx.query(
      `insert into editorial.content
       (id,content_type,title,slug,subtitle,summary,body_document,status,
        origin,created_by,version,created_at,updated_at)
       values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,now(),now())`,
      [
        e.id,e.contentType,e.title,e.slug,e.subtitle,e.summary,
        JSON.stringify(e.body),e.status,e.origin,createdBy,e.version,
      ],
    );
  }

  async lock(id:string,tx:Tx) {
    const r=await tx.query(
      `select * from editorial.content where id=$1 for update`,[id],
    );
    return r.rows[0] ?? null;
  }
}
