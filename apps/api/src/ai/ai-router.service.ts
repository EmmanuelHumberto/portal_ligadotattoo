import type {AiWorkloadRequest,AiNormalizedResult} from '@portal/contracts';
import {AiProviderRegistry} from './provider-registry';

export class AiRouterService{
 constructor(private readonly registry:AiProviderRegistry,
  private readonly policy:{primary:string;fallback:string[]}){}
 async execute(input:AiWorkloadRequest):Promise<AiNormalizedResult>{
  const order=[this.policy.primary,...this.policy.fallback]
   .filter((x,i,a)=>a.indexOf(x)===i&&this.registry.has(x));
  const failedProviders:string[]=[];
  for(const key of order){
   try{return await this.registry.get(key).execute(input)}
   catch{failedProviders.push(key)}
  }
  throw new Error(`AI_ALL_PROVIDERS_FAILED:${failedProviders.join('|')}`);
 }
}
