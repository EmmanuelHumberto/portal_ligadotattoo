import {
  Controller,Get,NotFoundException,Param,Query,Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { CommerceQuery } from './commerce.query';
import { AffiliateLinkService } from './affiliate-link.service';

@Controller()
export class CommerceController {
  constructor(
    private readonly query:CommerceQuery,
    private readonly links:AffiliateLinkService,
  ) {}

  @Get('admin/listings')
  @RequireCapability('commerce.read')
  listings(
    @Query('status') status?:string,@Query('sellerId') sellerId?:string,
  ){ return this.query.adminListings({status,sellerId}); }

  @Get('public/products/:slug/offers-v2')
  @Public()
  offers(@Param('slug') slug:string){ return this.query.publicOffers(slug); }

  @Get('go/listing/:id')
  @Public()
  async go(@Param('id') id:string,@Res() res:Response) {
    const url=await this.links.outbound(id);
    if (!url) throw new NotFoundException();
    res.setHeader('Referrer-Policy','no-referrer');
    return res.redirect(302,url);
  }
}
