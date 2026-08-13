import {describe,expect,it} from 'vitest';
import {API_SECURITY_HEADERS} from '../src/security/http-security';

describe('API security headers',()=>{
  it('keeps the defensive header baseline explicit',()=>{
    expect(API_SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
    expect(API_SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
    expect(API_SECURITY_HEADERS['Referrer-Policy']).toBe('no-referrer');
    expect(API_SECURITY_HEADERS['Permissions-Policy']).toContain('camera=()');
  });
});
