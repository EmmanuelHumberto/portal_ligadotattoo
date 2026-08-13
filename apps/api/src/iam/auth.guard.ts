import {
  CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from './public.decorator';

/**
 * Deployment adapter boundary.
 *
 * Production implementation MUST validate bearer JWT signature, issuer,
 * audience, expiration and other OIDC policy using the configured issuer/JWKS.
 * This class intentionally rejects tokens until a verifier is injected.
 */
export interface AccessTokenVerifier {
  verify(token: string): Promise<{
    sub: string;
    actorId: string;
    capabilities: string[];
    authenticationLevel?: string;
  }>;
}

export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACCESS_TOKEN_VERIFIER) private readonly verifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(), context.getClass(),
    ])) return true;

    const req = context.switchToHttp().getRequest();
    const value = String(req.headers.authorization ?? '');
    const match = /^Bearer (.+)$/i.exec(value);
    if (!match) throw new UnauthorizedException('Bearer token required');

    const token = match[1];
    if (!token) throw new UnauthorizedException('Bearer token required');
    const claims = await this.verifier.verify(token);
    req.actor = {
      actorId: claims.actorId,
      externalSubject: claims.sub,
      capabilities: new Set(claims.capabilities),
      authenticationLevel: claims.authenticationLevel ?? 'oidc',
    };
    return true;
  }
}
