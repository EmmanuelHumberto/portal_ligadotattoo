import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { PostgresAuditRepository } from '../platform/audit.repository';
import { OutboxRepository } from '../platform/outbox.repository';
import { EditorialRepository } from './editorial.repository';

@Injectable()
export class EditorialWorkflowHandler {
  constructor(
    private readonly txm:TransactionManager,
    private readonly repo:EditorialRepository,
    private readonly audit:PostgresAuditRepository,
    private readonly outbox:OutboxRepository,
  ) {}

  submit(id:string,expectedVersion:number,actorId:string) {
    return this.transition(id,expectedVersion,'DRAFT','IN_REVIEW',
      'editorial.submitted',actorId);
  }

  approve(id:string,expectedVersion:number,actorId:string,reason:string) {
    if (!reason.trim()) throw new Error('Approval reason is required');
    return this.transition(id,expectedVersion,'IN_REVIEW','APPROVED',
      'editorial.approved',actorId,reason);
  }

  publish(id:string,expectedVersion:number,actorId:string) {
    return this.txm.run(async tx => {
      const row=await this.repo.lock(id,tx);
      assertVersion(row,expectedVersion);
      if (!['APPROVED','SCHEDULED'].includes(row.status))
        throw new Error('Editorial content is not publishable');

      await assertPublishableRelations(tx,row.id);

      const now=new Date();
      const r=await tx.query(
        `update editorial.content
            set status='PUBLISHED',published_at=coalesce(published_at,$3),
                updated_at=$3,version=version+1
          where id=$1 and version=$2 returning *`,
        [id,expectedVersion,now],
      );

      await this.audit.append({
        actorId,action:'editorial.published',subjectType:'EditorialContent',
        subjectId:id,
      },tx);

      await this.outbox.append({
        id:randomUUID(),type:'editorial.content_published',version:1,
        aggregateType:'EditorialContent',aggregateId:id,occurredAt:now,
        payload:{slug:r.rows[0].slug,contentType:r.rows[0].content_type},
      },tx);

      return r.rows[0];
    });
  }

  schedule(id:string,expectedVersion:number,actorId:string,publishAt:Date) {
    if (publishAt <= new Date()) throw new Error('publishAt must be in future');
    return this.txm.run(async tx => {
      const row=await this.repo.lock(id,tx);
      assertVersion(row,expectedVersion);
      if (row.status !== 'APPROVED')
        throw new Error('Only approved content can be scheduled');
      const r=await tx.query(
        `update editorial.content
            set status='SCHEDULED',scheduled_at=$3,updated_at=now(),
                version=version+1
          where id=$1 and version=$2 returning *`,
        [id,expectedVersion,publishAt],
      );
      await this.audit.append({
        actorId,action:'editorial.scheduled',
        subjectType:'EditorialContent',subjectId:id,
        metadata:{publishAt:publishAt.toISOString()},
      },tx);
      return r.rows[0];
    });
  }

  private transition(
    id:string,expectedVersion:number,from:string,to:string,
    action:string,actorId:string,reason?:string,
  ) {
    return this.txm.run(async tx => {
      const row=await this.repo.lock(id,tx);
      assertVersion(row,expectedVersion);
      if (row.status !== from) throw new Error(`Expected ${from}`);
      const r=await tx.query(
        `update editorial.content set status=$3,updated_at=now(),
                version=version+1 where id=$1 and version=$2 returning *`,
        [id,expectedVersion,to],
      );
      await this.audit.append({
        actorId,action,subjectType:'EditorialContent',
        subjectId:id,reason,
      },tx);
      return r.rows[0];
    });
  }
}

function assertVersion(row:any,expected:number) {
  if (!row) throw Object.assign(new Error('Editorial content not found'),
    {name:'NotFoundError'});
  if (Number(row.version)!==expected)
    throw Object.assign(new Error('Editorial content changed'),
      {name:'ConcurrentModificationError'});
}

async function assertPublishableRelations(tx:any,contentId:string) {
  const invalid=await tx.query(
    `select count(*)::int count
       from editorial.content_media cm
       join media.media_asset m on m.id=cm.media_asset_id
      where cm.content_id=$1
        and not (m.status='ACTIVE' and m.rights_status='PERMITTED')`,
    [contentId],
  );
  if (invalid.rows[0].count > 0)
    throw new Error('Editorial content contains media without publication rights');
}
