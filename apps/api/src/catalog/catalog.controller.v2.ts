import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RequireCapability } from '../iam/require-capability.decorator';
import { CreateProductHandler } from './create-product.handler';

@Controller('admin/products')
export class ProductController {
  constructor(private readonly createProduct: CreateProductHandler) {}

  @Post()
  @HttpCode(201)
  @RequireCapability('catalog.write')
  async create(@Body() body: any) {
    const p = await this.createProduct.execute(body);
    return {
      id:p.id, manufacturerId:p.manufacturerId,
      productTypeKey:p.productTypeKey, name:p.name, slug:p.slug,
      brandId:p.brandId, modelCode:p.modelCode,
      lifecycle:p.lifecycle, version:p.version,
    };
  }
}
