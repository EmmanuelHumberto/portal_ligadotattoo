import {Body,Controller,Headers,Post,UnauthorizedException} from '@nestjs/common';
import {Public} from '../iam/public.decorator';
import {TranslateCatalogDescriptionHandler} from './translate-catalog-description.handler';

@Controller('internal/catalog')
export class InternalCatalogController {
  constructor(private readonly translations:TranslateCatalogDescriptionHandler) {}

  @Post('translate-description')
  @Public()
  translate(@Body() body:unknown,@Headers('x-internal-key') key:string) {
    const expected=process.env.INTERNAL_API_KEY;
    if(!expected||key!==expected)
      throw new UnauthorizedException('Invalid internal key');
    const proposalId=String(
      body&&typeof body==='object'&&'proposalId' in body
        ? (body as {proposalId?:unknown}).proposalId??'':'',
    ).trim();
    if(!proposalId)throw new Error('proposalId is required');
    return this.translations.execute(proposalId,'system:worker');
  }
}
