export type RuntimeConfig={
 nodeEnv:string;port:number;databaseUrl:string;redisUrl?:string;
 allowedBrowserOrigins:string[];trustProxyHops:number;
 dbPoolMax:number;dbConnectionTimeoutMs:number;dbReadinessTimeoutMs:number;
 workerHeartbeatStaleSeconds:number;
 ai:{
  defaultProvider:string;
  fallbackOrder:string[];
  openaiKey?:string;anthropicKey?:string;deepseekKey?:string;
  ollamaBaseUrl:string;ollamaContextWindow:number;
 };
};

export function validateRuntimeConfig(env:NodeJS.ProcessEnv):RuntimeConfig{
 const port=Number(env.PORT_API??3001);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT_API');
 const databaseUrl=required(env,'DATABASE_URL');
 const production=env.NODE_ENV==='production';
 if(production&&String(env.SESSION_SIGNING_SECRET??'').length<32)
  throw new Error('SESSION_SIGNING_SECRET must be >=32 chars in production');
 if(production&&String(env.RATE_LIMIT_HASH_SALT??'').length<32)
  throw new Error('RATE_LIMIT_HASH_SALT must be >=32 chars in production');
 return {
  nodeEnv:env.NODE_ENV??'development',port,databaseUrl,
  redisUrl:env.REDIS_URL,
  allowedBrowserOrigins:csv(env.ALLOWED_BROWSER_ORIGINS),
  trustProxyHops:boundedInteger(env.TRUST_PROXY_HOPS,0,0,3,'TRUST_PROXY_HOPS'),
  dbPoolMax:databasePoolMax(env.DB_POOL_MAX),
  dbConnectionTimeoutMs:databaseConnectionTimeoutMs(env.DB_CONNECTION_TIMEOUT_MS),
  dbReadinessTimeoutMs:databaseReadinessTimeoutMs(env.DB_READINESS_TIMEOUT_MS),
  workerHeartbeatStaleSeconds:workerHeartbeatStaleSeconds(
    env.WORKER_HEARTBEAT_STALE_SECONDS,
  ),
  ai:{
   defaultProvider:env.AI_DEFAULT_PROVIDER??'openai',
   fallbackOrder:csv(env.AI_FALLBACK_ORDER),
   openaiKey:env.OPENAI_API_KEY,
   anthropicKey:env.ANTHROPIC_API_KEY,
   deepseekKey:env.DEEPSEEK_API_KEY,
   ollamaBaseUrl:env.OLLAMA_BASE_URL?.trim()||'http://127.0.0.1:11434',
   ollamaContextWindow:boundedInteger(
    env.OLLAMA_CONTEXT_WINDOW,4096,512,32768,'OLLAMA_CONTEXT_WINDOW',
   ),
  },
 };
}
const csv=(v?:string)=>String(v??'').split(',').map(x=>x.trim()).filter(Boolean);
function required(env:NodeJS.ProcessEnv,key:string){
 const v=env[key]?.trim();if(!v)throw new Error(`Missing required environment variable: ${key}`);return v;
}

function boundedInteger(
 value:string|undefined,fallback:number,min:number,max:number,key:string,
){
 const result=Number(value??fallback);
 if(!Number.isInteger(result)||result<min||result>max)throw new Error(`Invalid ${key}`);
 return result;
}

export const databaseConnectionTimeoutMs=(value?:string)=>
 boundedInteger(value,2_000,100,10_000,'DB_CONNECTION_TIMEOUT_MS');
export const databaseReadinessTimeoutMs=(value?:string)=>
 boundedInteger(value,1_000,100,10_000,'DB_READINESS_TIMEOUT_MS');
export const databasePoolMax=(value?:string)=>
 boundedInteger(value,10,1,100,'DB_POOL_MAX');
export const workerHeartbeatStaleSeconds=(value?:string)=>
 boundedInteger(value,120,30,900,'WORKER_HEARTBEAT_STALE_SECONDS');
