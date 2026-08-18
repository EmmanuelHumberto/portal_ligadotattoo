import {
  createLocalJWKSet,exportJWK,generateKeyPair,SignJWT,
  type JWTVerifyGetKey,
} from 'jose';
import {beforeAll,describe,expect,it} from 'vitest';
import {
  createAccessTokenVerifier,OidcAccessTokenVerifier,readOidcVerifierConfig,
  type OidcVerifierConfig,
} from '../src/iam/oidc-access-token.verifier';

describe('OidcAccessTokenVerifier',()=>{
 const issuer='https://identity.example.test/';
 const audience='portal-api';
 const config:OidcVerifierConfig={
  issuer,audience:[audience],jwksUri:'https://identity.example.test/jwks',
  algorithms:['RS256'],actorIdClaim:'actor_id',
  capabilitiesClaim:'capabilities',clockToleranceSeconds:0,
 };
 let privateKey:CryptoKey;
 let keyResolver:JWTVerifyGetKey;
 let verifier:OidcAccessTokenVerifier;

 beforeAll(async()=>{
  const pair=await generateKeyPair('RS256');
  privateKey=pair.privateKey;
  const publicJwk=await exportJWK(pair.publicKey);
  keyResolver=createLocalJWKSet({
   keys:[{...publicJwk,kid:'test-key',alg:'RS256'}],
  });
  verifier=new OidcAccessTokenVerifier(config,keyResolver);
 });

 it('validates signature and maps actor claims',async()=>{
  const token=await signedToken({
   actor_id:'admin-1',capabilities:['catalog:write','media:write'],acr:'mfa',
  });
  await expect(verifier.verify(token)).resolves.toEqual({
   sub:'subject-1',actorId:'admin-1',
   capabilities:['catalog:write','media:write'],authenticationLevel:'mfa',
  });
 });

 it('grants full capabilities only to an explicitly configured email',async()=>{
  const adminVerifier=new OidcAccessTokenVerifier({
   ...config,fullAdminEmails:['admin@example.test'],
  },keyResolver);
  const token=await signedToken({
   actor_id:'admin@example.test',email:'ADMIN@example.test',
  });
  const claims=await adminVerifier.verify(token);
  expect(claims.capabilities).toContain('catalog.write');
  expect(claims.capabilities).toContain('audit.read');
 });

 it('does not elevate an email outside the configured allowlist',async()=>{
  const adminVerifier=new OidcAccessTokenVerifier({
   ...config,fullAdminEmails:['admin@example.test'],
  },keyResolver);
  const token=await signedToken({
   actor_id:'other@example.test',email:'other@example.test',
  });
  await expect(adminVerifier.verify(token)).resolves.toMatchObject({
   actorId:'other@example.test',capabilities:[],
  });
 });

 it('rejects a token for another audience',async()=>{
  const token=await signedToken({},'another-api');
  await expect(verifier.verify(token)).rejects.toThrow();
 });

 it('rejects expired tokens and tokens from another issuer',async()=>{
  const expired=await new SignJWT({actor_id:'admin-1'})
   .setProtectedHeader({alg:'RS256',kid:'test-key'})
   .setIssuer(issuer).setAudience(audience).setSubject('subject-1')
   .setIssuedAt().setExpirationTime(0).sign(privateKey);
  const foreign=await new SignJWT({actor_id:'admin-1'})
   .setProtectedHeader({alg:'RS256',kid:'test-key'})
   .setIssuer('https://foreign.example.test/').setAudience(audience)
   .setSubject('subject-1').setIssuedAt().setExpirationTime('5m').sign(privateKey);
  await expect(verifier.verify(expired)).rejects.toThrow();
  await expect(verifier.verify(foreign)).rejects.toThrow();
 });

 it('rejects tokens without expiration',async()=>{
  const token=await new SignJWT({actor_id:'admin-1'})
   .setProtectedHeader({alg:'RS256',kid:'test-key'})
   .setIssuer(issuer).setAudience(audience).setSubject('subject-1')
   .setIssuedAt().sign(privateKey);
  await expect(verifier.verify(token)).rejects.toThrow();
 });

 it('rejects malformed capabilities',async()=>{
  const token=await signedToken({actor_id:'admin-1',capabilities:{admin:true}});
  await expect(verifier.verify(token)).rejects.toThrow('Invalid OIDC claim');
 });

 async function signedToken(claims:Record<string,unknown>,aud=audience) {
  return new SignJWT(claims).setProtectedHeader({alg:'RS256',kid:'test-key'})
   .setIssuer(issuer).setAudience(aud).setSubject('subject-1')
   .setIssuedAt().setExpirationTime('5m').sign(privateKey);
 }
});

describe('readOidcVerifierConfig',()=>{
 it('keeps authentication fail-closed when OIDC is absent',()=>{
  expect(readOidcVerifierConfig({})).toBeNull();
 });

 it('rejects partial or insecure configuration',()=>{
  expect(()=>readOidcVerifierConfig({OIDC_ISSUER:'https://issuer.test'}))
   .toThrow('OIDC_JWKS_URI');
  expect(()=>readOidcVerifierConfig({
   OIDC_ISSUER:'http://issuer.test',OIDC_JWKS_URI:'https://issuer.test/jwks',
   OIDC_AUDIENCE:'portal-api',
  })).toThrow('HTTPS');
 });

 it('normalizes and validates the full-admin email allowlist',()=>{
  const config=readOidcVerifierConfig({
   OIDC_ISSUER:'https://issuer.test',
   OIDC_JWKS_URI:'https://issuer.test/jwks',
   OIDC_AUDIENCE:'portal-api',
   OIDC_FULL_ADMIN_EMAILS:'ADMIN@example.test,admin@example.test',
  });
  expect(config?.fullAdminEmails).toEqual(['admin@example.test']);
  expect(()=>readOidcVerifierConfig({
   OIDC_ISSUER:'https://issuer.test',
   OIDC_JWKS_URI:'https://issuer.test/jwks',
   OIDC_AUDIENCE:'portal-api',OIDC_FULL_ADMIN_EMAILS:'not-an-email',
  })).toThrow('invalid email');
 });
});

describe('development access token',()=>{
 it('accepts the local token only in development and test',async()=>{
  const verifier=createAccessTokenVerifier({
   NODE_ENV:'development',DEV_ADMIN_TOKEN:'local-secret',
  });
  await expect(verifier.verify('local-secret')).resolves.toMatchObject({
   actorId:'dev-admin',authenticationLevel:'dev',
  });
 });

 it('fails startup when a development token leaks into production',()=>{
  expect(()=>createAccessTokenVerifier({
   NODE_ENV:'production',DEV_ADMIN_TOKEN:'leaked-secret',
  })).toThrow('only allowed in development or test');
 });
});
