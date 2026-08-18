import {describe,expect,it} from 'vitest';
import {adminAuthorization} from '../../apps/web/lib/admin-authorization';

describe('adminAuthorization',()=>{
 it('forwards the signed Cloudflare Access assertion as a bearer token',()=>{
  expect(adminAuthorization({cloudflareAccessJwt:'signed.jwt.value'}))
   .toBe('Bearer signed.jwt.value');
 });

 it('keeps explicit bearer authorization as the first choice',()=>{
  expect(adminAuthorization({
   authorization:'Bearer explicit-token',
   cloudflareAccessJwt:'signed.jwt.value',sessionToken:'local-token',
  })).toBe('Bearer explicit-token');
 });

 it('retains the local development session fallback',()=>{
  expect(adminAuthorization({sessionToken:'local-token'}))
   .toBe('Bearer local-token');
  expect(adminAuthorization({})).toBeNull();
 });
});
