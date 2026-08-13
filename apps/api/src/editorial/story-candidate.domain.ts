export type CandidateStatus =
  | 'NEW'|'QUALIFIED'|'DRAFTED'|'DISMISSED';

export class StoryCandidate {
  constructor(
    readonly id:string,
    readonly sourceId:string,
    readonly sourceSnapshotId:string|null,
    readonly sourceUrl:string,
    readonly title:string,
    readonly detectedType:string|null,
    readonly relevanceScore:number|null,
    readonly status:CandidateStatus='NEW',
  ) {}
}
