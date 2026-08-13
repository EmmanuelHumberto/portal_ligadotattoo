import {
  CanActivate,ExecutionContext,HttpException,HttpStatus,Injectable,
} from '@nestjs/common';
import {createHmac} from 'node:crypto';
import type {Request,Response} from 'express';
import {RATE_POLICY,rateKey,type RateClass} from './rate-limit.policy';

type Bucket={count:number;resetAt:number};

export class FixedWindowRateLimiter {
  private readonly buckets=new Map<string,Bucket>();
  private operations=0;

  constructor(
    private readonly maxBuckets=50_000,
    private readonly now:()=>number=Date.now,
  ) {}

  consume(key:string,windowMs:number,limit:number) {
    const now=this.now();
    if(++this.operations%1_000===0)this.prune(now);
    let bucket=this.buckets.get(key);
    if(!bucket||bucket.resetAt<=now){
      if(!bucket&&this.buckets.size>=this.maxBuckets)this.prune(now);
      if(!bucket&&this.buckets.size>=this.maxBuckets)return {
        allowed:false,limit,remaining:0,resetAt:now+windowMs,
      };
      bucket={count:0,resetAt:now+windowMs};
      this.buckets.set(key,bucket);
    }
    bucket.count++;
    return {
      allowed:bucket.count<=limit,
      limit,
      remaining:Math.max(0,limit-bucket.count),
      resetAt:bucket.resetAt,
    };
  }

  private prune(now:number){
    for(const [key,bucket] of this.buckets){
      if(bucket.resetAt<=now)this.buckets.delete(key);
    }
  }
}

export function routeRateClass(method:string,path:string):RateClass {
  const normalized=path.split('?')[0]??path;
  if(normalized.startsWith('/admin/media/upload'))return 'upload';
  if(normalized.startsWith('/go/listing/'))return 'redirect';
  if(normalized.startsWith('/public/search'))return 'search';
  if(normalized.startsWith('/auth/'))return 'auth';
  if(normalized.startsWith('/admin/'))
    return ['GET','HEAD','OPTIONS'].includes(method.toUpperCase())
      ? 'admin_read':'admin_write';
  return 'public_read';
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limiter=new FixedWindowRateLimiter();

  canActivate(context:ExecutionContext) {
    const request=context.switchToHttp().getRequest<Request&{
      actor?:{actorId?:string};
    }>();
    const response=context.switchToHttp().getResponse<Response>();
    const routeClass=routeRateClass(request.method,request.originalUrl||request.url);
    const policy=RATE_POLICY[routeClass];
    const ipHash=pseudonymousIp(request.ip||request.socket.remoteAddress||'unknown');
    const key=rateKey({ipHash,actorId:request.actor?.actorId,routeClass});
    const result=this.limiter.consume(key,policy.windowMs,policy.limit);
    const resetSeconds=Math.max(1,Math.ceil((result.resetAt-Date.now())/1_000));

    response.setHeader('RateLimit-Limit',String(result.limit));
    response.setHeader('RateLimit-Remaining',String(result.remaining));
    response.setHeader('RateLimit-Reset',String(resetSeconds));
    response.setHeader('RateLimit-Policy',`${result.limit};w=${policy.windowMs/1_000}`);
    if(!result.allowed){
      response.setHeader('Retry-After',String(resetSeconds));
      throw new HttpException('Rate limit exceeded',HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}

function pseudonymousIp(ip:string) {
  const secret=process.env.RATE_LIMIT_HASH_SALT
    ?? process.env.SESSION_SIGNING_SECRET
    ?? 'portal-local-rate-limit';
  return createHmac('sha256',secret).update(ip).digest('hex').slice(0,24);
}
