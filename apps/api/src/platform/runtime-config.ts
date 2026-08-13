export type RuntimeConfig={
 nodeEnv:string;port:number;databaseUrl:string;redisUrl?:string;
 allowedBrowserOrigins:string[];
 ai:{
  defaultProvider:string;
  fallbackOrder:string[];
  openaiKey?:string;anthropicKey?:string;deepseekKey?:string;
 };
};

export function validateRuntimeConfig(env:NodeJS.ProcessEnv):RuntimeConfig{
 const port=Number(env.PORT_API??3001);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT_API');
 const databaseUrl=required(env,'DATABASE_URL');
 const production=env.NODE_ENV==='production';
 if(production&&String(env.SESSION_SIGNING_SECRET??'').length<32)
  throw new Error('SESSION_SIGNING_SECRET must be >=32 chars in production');
 return {
  nodeEnv:env.NODE_ENV??'development',port,databaseUrl,
  redisUrl:env.REDIS_URL,
  allowedBrowserOrigins:csv(env.ALLOWED_BROWSER_ORIGINS),
  ai:{
   defaultProvider:env.AI_DEFAULT_PROVIDER??'openai',
   fallbackOrder:csv(env.AI_FALLBACK_ORDER),
   openaiKey:env.OPENAI_API_KEY,
   anthropicKey:env.ANTHROPIC_API_KEY,
   deepseekKey:env.DEEPSEEK_API_KEY,
  },
 };
}
const csv=(v?:string)=>String(v??'').split(',').map(x=>x.trim()).filter(Boolean);
function required(env:NodeJS.ProcessEnv,key:string){
 const v=env[key]?.trim();if(!v)throw new Error(`Missing required environment variable: ${key}`);return v;
}
