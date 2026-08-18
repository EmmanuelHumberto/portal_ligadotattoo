import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {CatalogAuthorityProposalWriter} from './catalog-authority-proposal.writer';
import {CatalogMediaImporter} from './catalog-media.importer';
import {
  extractTechnicalSpecs,isNoise,slugify,type CatalogProductType,
} from './catalog-discovery.parsers';

export type DiscoveryManufacturer={id:string;name:string;slug:string};
export type DiscoveredProduct={
  name:string;url:string;category:CatalogProductType;
  imageUrls?:string[];description?:string;
};

export class CatalogProductDiscoveryWriter{
  constructor(
    private readonly pool:Pool,
    private readonly media:CatalogMediaImporter,
    private readonly authority:CatalogAuthorityProposalWriter,
  ){}

  async persist(
    manufacturer:DiscoveryManufacturer,input:DiscoveredProduct,machinesOnly=false,
  ):Promise<boolean>{
    if(!input.name||isNoise(input.name))return false;
    if(machinesOnly&&!['PEN','ROTARY','COIL','POWER_SUPPLY','BATTERY'].includes(input.category))
      return false;
    const productId=await this.ensureQuarantinedProductAndListing(manufacturer,input);
    await this.attachFirstImage(productId,manufacturer.name,input.imageUrls??[]);
    if(input.description&&input.description.length>20)
      await this.proposeContent(productId,input.description,input.url,input.category);
    return true;
  }

  private async ensureQuarantinedProductAndListing(
    manufacturer:DiscoveryManufacturer,input:DiscoveredProduct,
  ):Promise<string>{
    const client=await this.pool.connect();
    const productSlug=slugify(input.name);
    try{
      await client.query('begin');
      const existing=await client.query(
        `select id from catalog.product_model
          where manufacturer_id=$1 and slug=$2 limit 1`,[manufacturer.id,productSlug],
      );
      let productId:string;
      if(existing.rowCount){
        productId=String(existing.rows[0].id);
      }else{
        const inserted=await client.query(
          `insert into catalog.product_model
           (id,manufacturer_id,product_type_key,name,normalized_name,slug,
            model_code,lifecycle,version)
           values ($1,$2,$5,$3,lower($3),$4,null,'UNKNOWN',1)
           returning id`,
          [randomUUID(),manufacturer.id,input.name,productSlug,input.category],
        );
        productId=String(inserted.rows[0].id);
      }
      await client.query(
        `insert into commerce.listing
         (id,seller_id,product_model_id,external_id,url,normalized_url,
          affiliate_mode,availability,status,last_observed_at,version)
         select $1, s.id, $2, $3, $4, $4, 'NONE','UNKNOWN','PAUSED',now(),1
           from commerce.seller s
          where s.slug=$5
            and not exists (
              select 1 from commerce.listing li where li.normalized_url=$4
            )`,
        [randomUUID(),productId,productSlug,input.url,manufacturer.slug],
      );
      await client.query('commit');
      return productId;
    }catch(error){
      await client.query('rollback');
      throw error;
    }finally{client.release();}
  }

  private async attachFirstImage(
    productId:string,attribution:string,imageUrls:string[],
  ):Promise<void>{
    if(!imageUrls.length)return;
    const existing=await this.pool.query(
      `select 1 from media.media_link
        where subject_type='PRODUCT_MODEL' and subject_id=$1 limit 1`,[productId],
    );
    if(existing.rowCount)return;
    for(const imageUrl of imageUrls.slice(0,3)){
      const mediaId=await this.media.importPending(imageUrl,attribution);
      if(!mediaId)continue;
      await this.pool.query(
        `insert into media.media_link
         (id,media_asset_id,subject_type,subject_id,role,is_primary,sort_order)
         select gen_random_uuid(),$1,'PRODUCT_MODEL',$2,'hero',true,0
          where not exists (
            select 1 from media.media_link
             where subject_type='PRODUCT_MODEL' and subject_id=$2
          )`,[mediaId,productId],
      );
      return;
    }
  }

  private async proposeContent(
    productId:string,description:string,sourceUrl:string,category:CatalogProductType,
  ):Promise<void>{
    if(!await this.hasCanonicalFact(productId,'description'))
      await this.authority.propose({productId,propertyKey:'description',
        value:description.slice(0,3_000),sourceUrl});
    for(const specification of extractTechnicalSpecs(description,category)){
      if(!await this.hasCanonicalFact(productId,specification.key))
        await this.authority.propose({productId,propertyKey:specification.key,
          value:specification.value,sourceUrl});
    }
  }

  private async hasCanonicalFact(productId:string,propertyKey:string):Promise<boolean>{
    const result=await this.pool.query(
      `select 1 from knowledge.canonical_fact
        where subject_type='PRODUCT_MODEL' and subject_id=$1
          and property_key=$2 limit 1`,[productId,propertyKey],
    );
    return Boolean(result.rowCount);
  }
}
