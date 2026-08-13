import { Injectable } from '@nestjs/common';
import type { Tx } from './transaction-manager';
import type { AuditEntry, AuditPort } from './audit.port';

@Injectable()
export class PostgresAuditRepository implements AuditPort {
  async append(entry: AuditEntry, tx: Tx): Promise<void> {
    await tx.query(
      `insert into ops.audit_log
       (actor_id, action, subject_type, subject_id, reason, metadata, occurred_at)
       values ($1,$2,$3,$4,$5,$6::jsonb,now())`,
      [
        entry.actorId ?? null, entry.action, entry.subjectType,
        entry.subjectId, entry.reason ?? null,
        JSON.stringify(entry.metadata ?? {}),
      ],
    );
  }
}
