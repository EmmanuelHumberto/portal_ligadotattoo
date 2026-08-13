import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from 'jose';
import type {AccessTokenVerifier} from './auth.guard';

const SUPPORTED_ALGORITHMS=new Set([
  'RS256','RS384','RS512','PS256','PS384','PS512',
  'ES256','ES384','ES512','EdDSA',
]);

export type OidcVerifierConfig={
  issuer:string;
  audience:string[];
  jwksUri:string;
  algorithms:string[];
  actorIdClaim:string;
  capabilitiesClaim:string;
  clockToleranceSeconds:number;
};

export class OidcAccessTokenVerifier implements AccessTokenVerifier {
  private readonly keyResolver:JWTVerifyGetKey;

  constructor(
    private readonly config:OidcVerifierConfig,
    keyResolver?:JWTVerifyGetKey,
  ) {
    this.keyResolver=keyResolver ?? createRemoteJWKSet(new URL(config.jwksUri),{
      timeoutDuration:5000,
      cooldownDuration:30000,
      cacheMaxAge:600000,
    });
  }

  async verify(token:string) {
    const {payload}=await jwtVerify(token,this.keyResolver,{
      issuer:this.config.issuer,
      audience:this.config.audience,
      algorithms:this.config.algorithms,
      clockTolerance:this.config.clockToleranceSeconds,
      requiredClaims:['sub','exp'],
    });

    const actorId=stringClaim(payload,this.config.actorIdClaim);
    if(!actorId)throw new Error(`Missing OIDC claim: ${this.config.actorIdClaim}`);
    return {
      sub:payload.sub as string,
      actorId,
      capabilities:capabilitiesClaim(payload,this.config.capabilitiesClaim),
      authenticationLevel:stringClaim(payload,'acr') ?? 'oidc',
    };
  }
}

export function createAccessTokenVerifier(
  env:NodeJS.ProcessEnv,
):AccessTokenVerifier {
  const config=readOidcVerifierConfig(env);
  if(!config)return {
    async verify() {
      throw new Error('OIDC verifier is not configured');
    },
  };
  return new OidcAccessTokenVerifier(config);
}

export function readOidcVerifierConfig(
  env:NodeJS.ProcessEnv,
):OidcVerifierConfig|null {
  const issuer=env.OIDC_ISSUER?.trim();
  const jwksUri=env.OIDC_JWKS_URI?.trim();
  const audience=csv(env.OIDC_AUDIENCE);
  if(!issuer&&!jwksUri&&!audience.length)return null;
  if(!issuer)throw new Error('Missing required environment variable: OIDC_ISSUER');
  if(!jwksUri)throw new Error('Missing required environment variable: OIDC_JWKS_URI');
  if(!audience.length)throw new Error('Missing required environment variable: OIDC_AUDIENCE');

  validateSecureUrl(issuer,'OIDC_ISSUER');
  validateSecureUrl(jwksUri,'OIDC_JWKS_URI');
  const algorithms=csv(env.OIDC_ALLOWED_ALGORITHMS||'RS256');
  if(!algorithms.length||algorithms.some(value=>!SUPPORTED_ALGORITHMS.has(value)))
    throw new Error('OIDC_ALLOWED_ALGORITHMS contains an unsupported algorithm');

  return {
    issuer,audience,jwksUri,algorithms,
    actorIdClaim:claimName(env.OIDC_ACTOR_ID_CLAIM,'sub'),
    capabilitiesClaim:claimName(env.OIDC_CAPABILITIES_CLAIM,'capabilities'),
    clockToleranceSeconds:boundedInteger(env.OIDC_CLOCK_TOLERANCE_SECONDS,5,0,60),
  };
}

function stringClaim(payload:JWTPayload,name:string) {
  const value=payload[name];
  return typeof value==='string'&&value.trim() ? value.trim() : undefined;
}

function capabilitiesClaim(payload:JWTPayload,name:string):string[] {
  const value=payload[name];
  if(value===undefined)return [];
  const capabilities=typeof value==='string'
    ? value.split(/[,\s]+/).filter(Boolean)
    : Array.isArray(value)&&value.every(item=>typeof item==='string')
      ? value.map(item=>item.trim()).filter(Boolean)
      : null;
  if(!capabilities)throw new Error(`Invalid OIDC claim: ${name}`);
  return [...new Set(capabilities)];
}

function validateSecureUrl(value:string,key:string) {
  let url:URL;
  try {url=new URL(value);} catch {throw new Error(`Invalid ${key}`);}
  const local=['localhost','127.0.0.1','::1'].includes(url.hostname);
  if(url.protocol!=='https:'&&!(local&&url.protocol==='http:'))
    throw new Error(`${key} must use HTTPS`);
  if(url.username||url.password||url.hash)throw new Error(`Invalid ${key}`);
}

function claimName(value:string|undefined,fallback:string) {
  const result=value?.trim()||fallback;
  if(!/^[A-Za-z0-9_.:-]{1,100}$/.test(result))throw new Error('Invalid OIDC claim name');
  return result;
}

function boundedInteger(
  value:string|undefined,fallback:number,min:number,max:number,
) {
  const result=Number(value??fallback);
  if(!Number.isInteger(result)||result<min||result>max)
    throw new Error('Invalid OIDC_CLOCK_TOLERANCE_SECONDS');
  return result;
}

const csv=(value?:string)=>String(value??'').split(',')
  .map(item=>item.trim()).filter(Boolean);
