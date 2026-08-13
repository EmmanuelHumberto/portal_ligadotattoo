import {NextRequest,NextResponse} from 'next/server';

export function proxy(req:NextRequest){
 const nonce=crypto.randomUUID().replace(/-/g,'');
 const prod=process.env.NODE_ENV==='production';

 const csp=[
  "default-src 'self'",
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${prod?'':" 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  prod?"upgrade-insecure-requests":"",
 ].filter(Boolean).join('; ');

 const requestHeaders=new Headers(req.headers);
 requestHeaders.set('x-nonce',nonce);
 requestHeaders.set('Content-Security-Policy',csp);
 const res=NextResponse.next({request:{headers:requestHeaders}});
 res.headers.set('Content-Security-Policy',csp);
 res.headers.set('X-Content-Type-Options','nosniff');
 res.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 res.headers.set('X-Frame-Options','DENY');
 res.headers.set('Permissions-Policy',
  'camera=(), microphone=(), geolocation=(), payment=()');
 res.headers.set('Cross-Origin-Opener-Policy','same-origin');
 res.headers.set('Cross-Origin-Resource-Policy','same-site');
 return res;
}
export const config={matcher:['/((?!api|_next/static|_next/image|favicon.ico).*)']};
