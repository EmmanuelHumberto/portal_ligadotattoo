export type RuntimeEnvironment='development'|'test'|'staging'|'production';

export type AiWorkloadRequest={
 workload:string;
 prompt:string;
 metadata?:Record<string,string|number|boolean>;
};

export type AiNormalizedResult={
 provider:string;
 model:string;
 text:string;
 latencyMs:number;
 usage?:{inputTokens?:number;outputTokens?:number};
};
