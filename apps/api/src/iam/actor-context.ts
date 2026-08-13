export type ActorContext = {
  actorId: string;
  externalSubject: string;
  capabilities: ReadonlySet<string>;
  authenticationLevel: string;
};

export const ACTOR = Symbol('ACTOR');
