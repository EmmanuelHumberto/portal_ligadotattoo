export type AIWorkload =
  | 'editorial.classify'
  | 'editorial.summarize'
  | 'editorial.draft'
  | 'editorial.extract_event';

export type AIRequest = {
  workload:AIWorkload;
  input:Record<string,unknown>;
  correlationId:string;
};

export type AIResult<T=unknown> = {
  output:T;
  providerKey:string;
  modelKey:string;
  usage?:Record<string,number>;
  latencyMs:number;
};

export interface AIProviderHubPort {
  execute<T>(request:AIRequest):Promise<AIResult<T>>;
}

export const AI_PROVIDER_HUB = Symbol('AI_PROVIDER_HUB');
