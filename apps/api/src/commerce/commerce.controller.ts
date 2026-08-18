import {BadRequestException,Body,Controller,Get,NotFoundException,Param,
  ParseUUIDPipe,Post,Query,Res} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import {listingUrlInput,priceInput} from './admin-commerce.input';
import { CommerceQuery } from './commerce.query';
import { AffiliateLinkService } from './affiliate-link.service';
import { RecordPriceHandler } from './record-price.handler';
import {SetListingUrlHandler} from './set-listing-url.handler';

@Controller()
export class CommerceController {
  constructor(
    private readonly query:CommerceQuery,
    private readonly links:AffiliateLinkService,
    private readonly recordPrice:RecordPriceHandler,
    private readonly setUrl:SetListingUrlHandler,
  ) {}

  @Get('admin/listings')
  @RequireCapability('commerce.read')
  listings(
    @Query('status') status?:string,@Query('sellerId') sellerId?:string,
  ){ return this.query.adminListings({status,sellerId}); }

  @Post('admin/listings/:id/prices')
  @RequireCapability('commerce.manage')
  recordPriceObservation(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown) {
    return this.recordPrice.execute({listingId:id,...priceInput(body)});
  }

  @Post('admin/listings/:id/url')
  @RequireCapability('commerce.manage')
  setListingUrl(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown) {
    return this.setUrl.execute(id,listingUrlInput(body));
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
