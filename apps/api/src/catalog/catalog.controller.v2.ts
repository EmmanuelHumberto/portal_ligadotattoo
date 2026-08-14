import {
  Body,Controller,Get,HttpCode,Inject,Param,Post,
  UploadedFile,UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {Actor} from '../iam/actor.decorator';
import {RequireCapability} from '../iam/require-capability.decorator';
import {PG_POOL} from '../platform/database.module';
import {UploadMediaHandler} from '../media/upload-media.handler';
import {CreateProductHandler} from './create-product.handler';
import {AdminProductQuery} from './admin-product.query';

@Controller('admin/products')
export class ProductController {
  constructor(
    private readonly createProduct: CreateProductHandler,
    private readonly products: AdminProductQuery,
    private readonly uploads: UploadMediaHandler,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  @Get()
  @RequireCapability('catalog.read')
  list(){ return this.products.list(); }

  @Get(':id')
  @RequireCapability('catalog.read')
  detail(@Param('id') id:string){ return this.products.byId(id); }

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

  @Post(':id/image')
  @RequireCapability('catalog.write')
  @UseInterceptors(FileInterceptor('file',{
    limits:{fileSize:25*1024*1024,files:1,fields:5},
  }))
  async attachImage(
    @Param('id') id:string,
    @UploadedFile() file:Express.Multer.File,
    @Actor() actor:any,
  ) {
    const asset = await this.uploads.execute(file, actor.actorId);

    await this.pool.query(
      `update media.media_asset
          set rights_status='PERMITTED',version=version+1,updated_at=now()
        where id=$1`,
      [asset.id],
    );
    await this.pool.query(
      `insert into media.media_rights
       (id,media_asset_id,status,basis,is_current,decided_by,decided_at)
       values (gen_random_uuid(),$1,'PERMITTED','CURATOR_UPLOAD',true,$2,now())`,
      [asset.id, actor.actorId],
    );
    await this.pool.query(
      `insert into media.media_link
       (id,media_asset_id,subject_type,subject_id,role,is_primary,sort_order)
       values (gen_random_uuid(),$1,'PRODUCT_MODEL',$2,'hero',true,0)`,
      [asset.id, id],
    );

    return {mediaId:asset.id, productId:id};
  }

  @Post(':id/specs')
  @RequireCapability('catalog.write')
  async setSpecs(
    @Param('id') id:string,@Body() body:any,@Actor() actor:any,
  ) {
    const facts:Array<{key:string;value:unknown;unit:string|null}> = [];
    const summary=String(body.summary ?? '').trim();
    const description=String(body.description ?? '').trim();
    if(summary)facts.push({key:'summary',value:summary,unit:null});
    if(description)facts.push({key:'description',value:description,unit:null});
    const specs=Array.isArray(body.specs)?body.specs:[];
    for(const s of specs){
      const key=String(s?.key ?? '').trim();
      if(!key)continue;
      facts.push({key,value:s.value,unit:s.unit?String(s.unit):null});
    }
    for(const f of facts){
      await this.pool.query(
        `update knowledge.canonical_fact
            set valid_to=now()
          where subject_type='PRODUCT_MODEL' and subject_id=$1
            and property_key=$2 and valid_to is null`,
        [id,f.key],
      );
      const claimId=randomUUID();
      await this.pool.query(
        `insert into knowledge.claim
         (id,subject_type,subject_id,property_key,value,claimant_type,
          observed_at,status,version,created_at)
         values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,'CURATOR',
          now(),'ACTIVE',1,now())`,
        [claimId,id,f.key,JSON.stringify(f.value)],
      );
      const proposalId=randomUUID();
      await this.pool.query(
        `insert into knowledge.canonical_proposal
         (id,subject_type,subject_id,property_key,proposed_value,evidence_ids,
          status,created_by,created_at,decided_by,decided_at,decision_reason,
          version)
         values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,ARRAY[$5]::uuid[],'APPROVED',
          $6,now(),$6,now(),'CURATOR_MANUAL',1)`,
        [proposalId,id,f.key,JSON.stringify(f.value),claimId,actor.actorId],
      );
      await this.pool.query(
        `insert into knowledge.canonical_fact
         (id,subject_type,subject_id,property_key,value,unit,valid_from,
          proposal_id,decided_by,decision_reason,version)
         values (gen_random_uuid(),'PRODUCT_MODEL',$1,$2,$3::jsonb,$4,now(),
          $5,$6,'CURATOR_MANUAL',1)`,
        [id,f.key,JSON.stringify(f.value),f.unit,proposalId,actor.actorId],
      );
    }
    return {facts:facts.length};
  }
}
