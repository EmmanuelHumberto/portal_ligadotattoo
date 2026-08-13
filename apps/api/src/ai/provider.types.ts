export type ProviderKey='openai'|'anthropic'|'deepseek'|string;

export type ModelConfig={
  key:string;
  providerKey:ProviderKey;
  providerModelId:string;
  enabled:boolean;
  inputCostPerMillion?:number;
  outputCostPerMillion?:number;
  maxInputTokens?:number;
  maxOutputTokens?:number;
};

export type ProviderRequest={
  model:ModelConfig;
  system?:string;
  prompt:string;
  temperature?:number;
  maxOutputTokens?:number;
  responseFormat?:'text'|'json';
};

export type ProviderResponse={
  text:string;
  inputTokens?:number;
  outputTokens?:number;
  providerRequestId?:string;
};

export interface AIProviderAdapter {
  readonly key:ProviderKey;
  execute(request:ProviderRequest,signal:AbortSignal):Promise<ProviderResponse>;
}
