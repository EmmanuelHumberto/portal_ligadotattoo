import {
  Controller,Get,Header,NotFoundException,Param,Query,
} from '@nestjs/common';
import { Public } from '../iam/public.decorator';
import { PublicProductQuery } from './public-product.query';

@Controller('public/products')
@Public()
export class PublicCatalogController {
  constructor(private readonly products: PublicProductQuery) {}

  @Get()
  list(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('productType') productType?: string,
    @Query('manufacturer') manufacturer?: string,
  ) {
    return this.products.list({
      limit: Number(limit ?? 24), cursor, productType, manufacturer,
    });
  }

  @Get('facets')
  facets(
    @Query('productType') productType?: string,
    @Query('manufacturer') manufacturer?: string,
  ) {
    return this.products.facets({ productType, manufacturer });
  }

  @Get('compare')
  compare(@Query('ids') ids = '') {
    return this.products.compare(ids.split(',').filter(Boolean).slice(0, 4));
  }

  @Get(':slug')
  @Header('Cache-Control','private, no-store')
  async detail(@Param('slug') slug: string) {
    const product = await this.products.bySlug(slug);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
