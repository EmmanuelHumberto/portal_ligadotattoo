import {
 CanActivate,ExecutionContext,ForbiddenException,Injectable,
} from '@nestjs/common';

const SAFE=new Set(['GET','HEAD','OPTIONS']);

@Injectable()
export class OriginCsrfGuard implements CanActivate {
 canActivate(ctx:ExecutionContext){
  const req=ctx.switchToHttp().getRequest();
  if(SAFE.has(req.method))return true;

  // Bearer/service authentication does not rely on ambient browser cookies.
  if(String(req.headers.authorization??'').startsWith('Bearer '))return true;

  const origin=req.headers.origin;
  const allowed=(process.env.ALLOWED_BROWSER_ORIGINS??'')
   .split(',').map(x=>x.trim()).filter(Boolean);

  if(!origin || !allowed.includes(origin))
   throw new ForbiddenException('Invalid request origin');

  const cookieToken=req.cookies?.['pt_csrf'];
  const headerToken=req.headers['x-csrf-token'];
  if(!cookieToken || !headerToken || cookieToken!==headerToken)
   throw new ForbiddenException('CSRF validation failed');
  return true;
 }
}
