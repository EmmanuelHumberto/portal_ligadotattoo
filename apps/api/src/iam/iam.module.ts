import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, ACCESS_TOKEN_VERIFIER } from './auth.guard';
import { CapabilityGuard } from './capability.guard';

@Global()
@Module({
  providers: [
    {
      provide: ACCESS_TOKEN_VERIFIER,
      useFactory: () => ({
        async verify() {
          throw new Error(
            'OIDC verifier not configured. Configure issuer/JWKS before exposing admin API.',
          );
        },
      }),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: CapabilityGuard },
  ],
  exports: [ACCESS_TOKEN_VERIFIER],
})
export class IamModule {}
