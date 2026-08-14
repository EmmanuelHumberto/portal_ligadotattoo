import type {JobHandler,JobResult} from '../job-runner';

export class AutoDraftHandler implements JobHandler {
  readonly type='editorial.auto_draft';

  constructor(
    private readonly apiBase:string,
    private readonly internalKey:string,
  ) {}

  async handle(payload:unknown):Promise<JobResult>{
    const candidateId=(payload as Record<string,unknown>|null)?.candidateId;
    if(!candidateId) return 'NON_RETRYABLE';

    try {
      const response=await fetch(`${this.apiBase}/internal/editorial/auto-draft`,{
        method:'POST',
        headers:{
          'content-type':'application/json',
          'x-internal-key':this.internalKey,
        },
        body:JSON.stringify({candidateId}),
      });
      if(response.ok) return 'DONE';
      return response.status>=400 && response.status<500
        ? 'NON_RETRYABLE'
        : 'RETRYABLE';
    } catch {
      return 'RETRYABLE';
    }
  }
}
