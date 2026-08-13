import type { Tx } from './transaction-manager';

export type AuditEntry = {
  actorId?: string;
  action: string;
  subjectType: string;
  subjectId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export interface AuditPort {
  append(entry: AuditEntry, tx: Tx): Promise<void>;
}
