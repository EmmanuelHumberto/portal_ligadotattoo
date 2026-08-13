import type {AiNormalizedResult,AiWorkloadRequest} from '@portal/contracts';

export interface AiProvider {
 readonly key:string;
 execute(input:AiWorkloadRequest,model?:string):Promise<AiNormalizedResult>;
}
