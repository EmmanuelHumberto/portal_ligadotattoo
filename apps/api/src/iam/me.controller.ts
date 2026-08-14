import { Controller, Get } from '@nestjs/common';
import { Actor } from './actor.decorator';
import type { ActorContext } from './actor-context';

@Controller('admin/me')
export class MeController {
  @Get()
  me(@Actor() actor: ActorContext | undefined) {
    return {
      actorId: actor?.actorId,
      externalSubject: actor?.externalSubject,
      capabilities: actor?.capabilities ? [...actor.capabilities].sort() : [],
      authenticationLevel: actor?.authenticationLevel,
    };
  }
}
