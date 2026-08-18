import {
  Body,Controller,Get,HttpCode,Param,ParseUUIDPipe,Patch,Post,Query,
  UploadedFile,UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {Actor} from '../iam/actor.decorator';
import type {ActorContext} from '../iam/actor-context';
import {RequireCapability} from '../iam/require-capability.decorator';
import {AttachProductImageHandler} from './attach-product-image.handler';
import {
  discoveryInput,productCreateInput,productMetaInput,productRenameInput,productSpecsInput,
  productTypeInput,
} from './admin-product.input';
import {AdminProductQuery} from './admin-product.query';
import {CreateProductHandler} from './create-product.handler';
import {RenameProductHandler} from './rename-product.handler';
import {RunCatalogDiscoveryHandler} from './run-catalog-discovery.handler';
import {SetProductSpecsHandler} from './set-product-specs.handler';
import {SetProductTypeHandler} from './set-product-type.handler';
import {UpdateProductMetaHandler} from './update-product-meta.handler';

@Controller('admin/products')
export class ProductController {
  constructor(
    private readonly createProduct:CreateProductHandler,
    private readonly products:AdminProductQuery,
    private readonly attachImage:AttachProductImageHandler,
    private readonly setSpecsHandler:SetProductSpecsHandler,
    private readonly setTypeHandler:SetProductTypeHandler,
    private readonly updateMetaHandler:UpdateProductMetaHandler,
    private readonly renameHandler:RenameProductHandler,
    private readonly discovery:RunCatalogDiscoveryHandler,
  ) {}

  @Get()
  @RequireCapability('catalog.read')
  list(@Query('type') type?:string){return this.products.list(100,type);}

  @Get(':id')
  @RequireCapability('catalog.read')
  detail(@Param('id',ParseUUIDPipe) id:string){return this.products.byId(id);}

  @Post()
  @HttpCode(201)
  @RequireCapability('catalog.write')
  async create(@Body() body:unknown,@Actor() actor:ActorContext){
    const p=await this.createProduct.execute(productCreateInput(body),actor.actorId);
    return {id:p.id,manufacturerId:p.manufacturerId,
      productTypeKey:p.productTypeKey,name:p.name,slug:p.slug,
      brandId:p.brandId,modelCode:p.modelCode,lifecycle:p.lifecycle,version:p.version};
  }

  @Post(':id/image')
  @RequireCapability('catalog.write')
  @UseInterceptors(FileInterceptor('file',{
    limits:{fileSize:25*1024*1024,files:1,fields:5},
  }))
  image(@Param('id',ParseUUIDPipe) id:string,
    @UploadedFile() file:Express.Multer.File|undefined,@Actor() actor:ActorContext){
    return this.attachImage.execute(id,file,actor.actorId);
  }

  @Post(':id/specs')
  @RequireCapability('catalog.write')
  setSpecs(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext){
    return this.setSpecsHandler.execute(id,productSpecsInput(body),actor.actorId);
  }

  @Patch(':id/type')
  @RequireCapability('catalog.write')
  setType(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext){
    return this.setTypeHandler.execute(id,productTypeInput(body),actor.actorId);
  }

  @Patch(':id/meta')
  @RequireCapability('catalog.write')
  updateMeta(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext){
    return this.updateMetaHandler.execute(id,productMetaInput(body),actor.actorId);
  }

  @Patch(':id')
  @RequireCapability('catalog.write')
  rename(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext){
    return this.renameHandler.execute(id,productRenameInput(body),actor.actorId);
  }

  @Post('discovery/run')
  @RequireCapability('catalog.write')
  runDiscovery(@Body() body:unknown,@Actor() actor:ActorContext){
    return this.discovery.execute(discoveryInput(body),actor.actorId);
  }
}
