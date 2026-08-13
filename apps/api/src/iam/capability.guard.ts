import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_CAPABILITY } from './require-capability.decorator';

@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const capability = this.reflector.getAllAndOverride<string>(
      REQUIRED_CAPABILITY,
      [context.getHandler(), context.getClass()],
    );
    if (!capability) return true;

    const actor = context.switchToHttp().getRequest().actor;
    if (!actor?.capabilities?.has(capability))
      throw new ForbiddenException(`Capability required: ${capability}`);
    return true;
  }
}
