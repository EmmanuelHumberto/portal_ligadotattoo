import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../iam/public.decorator';
import { CommercePublicQuery } from './commerce-public.query';

@Controller('public/products/:slug')
@Public()
export class PublicCommerceController {
  constructor(private readonly commerce:CommercePublicQuery) {}

  @Get('offers')
  offers(@Param('slug') slug:string) {
    return this.commerce.offers(slug);
  }

  @Get('price-history')
  history(@Param('slug') slug:string,@Query('window') window='90d') {
    return this.commerce.priceHistory(slug,window);
  }
}
