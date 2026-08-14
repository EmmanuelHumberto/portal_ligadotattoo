import {
  Body, Controller, Headers, Post, UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../iam/public.decorator';
import { GenerateAIDraftHandler } from './generate-ai-draft.handler';

@Controller('internal/editorial')
export class InternalEditorialController {
  constructor(private readonly aiDraft:GenerateAIDraftHandler) {}

  @Post('auto-draft')
  @Public()
  async autoDraft(@Body() body:any,@Headers('x-internal-key') key:string) {
    const expected=process.env.INTERNAL_API_KEY;
    if(!expected || key!==expected) {
      throw new UnauthorizedException('Invalid internal key');
    }
    return this.aiDraft.execute({...body,actorId:'system:worker'});
  }
}
