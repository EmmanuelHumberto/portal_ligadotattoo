export type ClaimStatus = 'ACTIVE' | 'REJECTED' | 'DISPUTED' | 'SUPERSEDED';

export class Claim {
  private constructor(
    readonly id:string,
    readonly subjectType:string,
    readonly subjectId:string,
    readonly propertyKey:string,
    readonly value:unknown,
    readonly claimantType:string,
    readonly claimantId:string|null,
    readonly sourceSnapshotId:string|null,
    readonly sourceUrl:string|null,
    readonly observedAt:Date,
    readonly confidence:number|null,
    private _status:ClaimStatus,
    private _version:number,
  ) {}

  static record(input:{
    id:string; subjectType:string; subjectId:string; propertyKey:string;
    value:unknown; claimantType:string; claimantId?:string;
    sourceSnapshotId?:string; sourceUrl?:string; observedAt?:Date;
    confidence?:number;
  }) {
    if (!input.subjectType.trim()) throw new Error('subjectType is required');
    if (!input.propertyKey.trim()) throw new Error('propertyKey is required');
    if (input.value === undefined) throw new Error('claim value is required');
    if (input.confidence != null &&
       (input.confidence < 0 || input.confidence > 1))
      throw new Error('confidence must be between 0 and 1');

    return new Claim(
      input.id,input.subjectType,input.subjectId,input.propertyKey,input.value,
      input.claimantType,input.claimantId ?? null,input.sourceSnapshotId ?? null,
      input.sourceUrl ?? null,input.observedAt ?? new Date(),
      input.confidence ?? null,'ACTIVE',1,
    );
  }

  dispute(){ this._status='DISPUTED'; }
  reject(){ this._status='REJECTED'; }

  get status(){ return this._status; }
  get version(){ return this._version; }
}
