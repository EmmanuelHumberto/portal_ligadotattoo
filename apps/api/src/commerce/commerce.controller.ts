import {
  BadRequestException,Body,Controller,Get,Inject,NotFoundException,Param,Post,Query,Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { CommerceQuery } from './commerce.query';
import { AffiliateLinkService } from './affiliate-link.service';
import { RecordPriceHandler } from './record-price.handler';

@Controller()
export class CommerceController {
  constructor(
    private readonly query:CommerceQuery,
    private readonly links:AffiliateLinkService,
    private readonly recordPrice:RecordPriceHandler,
    @Inject(PG_POOL) private readonly pool:Pool,
  ) {}

  @Get('admin/listings')
  @RequireCapability('commerce.read')
  listings(
    @Query('status') status?:string,@Query('sellerId') sellerId?:string,
  ){ return this.query.adminListings({status,sellerId}); }

  @Post('admin/listings/:id/prices')
  @RequireCapability('commerce.manage')
  recordPriceObservation(@Param('id') id:string,@Body() body:any) {
    return this.recordPrice.execute({listingId:id,...body});
  }

  @Post('admin/listings/:id/url')
  @RequireCapability('commerce.manage')
  async setListingUrl(@Param('id') id:string,@Body() body:any) {
    const url=String(body.url ?? '').trim();
    if(!/^https?:\/\//i.test(url))throw new BadRequestException('Invalid URL');
    const r=await this.pool.query(
      `update commerce.listing
          set url=$2,updated_at=now(),version=version+1
        where id=$1 returning id,url`,
      [id,url],
    );
    if(!r.rowCount)throw new NotFoundException('Listing not found');
    return r.rows[0];
  }

  @Get('public/offers/compare')
  @Public()
  compareOffers(@Query('ids') ids='') {
    return this.query.compareOffers(ids.split(',').filter(Boolean).slice(0,4));
  }

  @Get('public/offers')
  @Public()
  offerFeed(@Query('limit') limit='24',@Query('cursor') cursor?:string) {
    const parsed=Number(limit);
    if(!Number.isInteger(parsed)||parsed<1||parsed>100)
      throw new BadRequestException('Invalid offer limit');
    if(cursor&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cursor))
      throw new BadRequestException('Invalid offer cursor');
    return this.query.publicOfferFeed({limit:parsed,cursor});
  }

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
