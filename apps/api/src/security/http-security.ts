import type {INestApplication} from '@nestjs/common';
import type {Application,Request,Response,NextFunction} from 'express';

export const API_SECURITY_HEADERS={
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Resource-Policy':'same-site',
} as const;

export function configureHttpSecurity(
  app:INestApplication,
  allowedOrigins:string[],
  trustProxyHops=0,
) {
  const express=app.getHttpAdapter().getInstance() as Application;
  express.disable('x-powered-by');
  express.set('trust proxy',trustProxyHops);
  app.use((_request:Request,response:Response,next:NextFunction)=>{
    for(const [name,value] of Object.entries(API_SECURITY_HEADERS))
      response.setHeader(name,value);
    next();
  });
  if(allowedOrigins.length){
    const allowed=new Set(allowedOrigins);
    app.enableCors({
      origin(
        origin:string|undefined,
        callback:(error:Error|null,allow?:boolean)=>void,
      ){
        if(!origin||allowed.has(origin))return callback(null,true);
        callback(new Error('Origin is not allowed by CORS'));
      },
      methods:['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
      allowedHeaders:['Authorization','Content-Type','X-CSRF-Token'],
      credentials:true,
      maxAge:600,
    });
  }
}
