export type ActorContext = { actorId: string; externalSubject: string; capabilities: ReadonlySet<string>; authenticationLevel: string };
export type DomainEvent<T = unknown> = { id: string; type: string; occurredAt: Date; payload: T };
export abstract class DomainError extends Error { constructor(public readonly code: string, message: string) { super(message); } }
export class ConcurrentModificationError extends DomainError { constructor(){ super('CONCURRENT_MODIFICATION','Aggregate changed since it was read'); } }
