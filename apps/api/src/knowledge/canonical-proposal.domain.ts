export type ProposalStatus = 'PENDING'|'APPROVED'|'REJECTED';

export class CanonicalProposal {
  private constructor(
    readonly id:string,
    readonly subjectType:string,
    readonly subjectId:string,
    readonly propertyKey:string,
    readonly proposedValue:unknown,
    readonly evidenceIds:string[],
    private _status:ProposalStatus,
    private _version:number,
  ) {}

  static create(input:{
    id:string;subjectType:string;subjectId:string;propertyKey:string;
    proposedValue:unknown;evidenceIds:string[];
  }) {
    if (!input.evidenceIds.length) throw new Error('Evidence is required');
    return new CanonicalProposal(
      input.id,input.subjectType,input.subjectId,input.propertyKey,
      input.proposedValue,[...new Set(input.evidenceIds)],'PENDING',1,
    );
  }

  get status(){ return this._status; }
  get version(){ return this._version; }
}
