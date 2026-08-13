import { SetMetadata } from '@nestjs/common';
export const REQUIRED_CAPABILITY = 'portal:required-capability';
export const RequireCapability = (capability: string) =>
  SetMetadata(REQUIRED_CAPABILITY, capability);
