import {describe,expect,it,vi} from 'vitest';
import type {Pool} from 'pg';
import {PublicProductQuery} from '../src/catalog/public-product.query';
import type {MediaDeliveryPort} from '../src/media/media-storage.port';

describe('PublicProductQuery.list',()=>{
 it('returns the filtered total independently from cursor pagination',async()=>{
  const query=vi.fn(async(sql:string,_params:unknown[])=>{
   if(sql.includes('count(*)::int total'))return {rows:[{total:25}]};
   return {rows:[{
    id:'00000000-0000-0000-0000-000000000001',slug:'machine-one',
    name:'Machine One',product_type_key:'PEN',lifecycle:'ACTIVE',
    manufacturer_id:'00000000-0000-0000-0000-000000000002',
    manufacturer_name:'Maker',manufacturer_slug:'maker',brand_name:null,
    hero_key:null,offer_amount:null,offer_currency:null,
   }]};
  });
  const products=new PublicProductQuery(
   {query} as unknown as Pool,
   {url:vi.fn()} as unknown as MediaDeliveryPort,
  );

  const result=await products.list({
   limit:48,productType:'PEN,ROTARY,COIL',
   cursor:'00000000-0000-0000-0000-000000000000',
  });

  expect(result.meta).toEqual({hasMore:false,nextCursor:null,total:25});
  const countCall=query.mock.calls.find(([sql])=>sql.includes('count(*)::int total'));
  expect(countCall?.[1]).toEqual([['PEN','ROTARY','COIL']]);
  const listCall=query.mock.calls.find(([sql])=>sql.includes('offer.amount'));
  expect(listCall?.[1]).toEqual([
   ['PEN','ROTARY','COIL'],'00000000-0000-0000-0000-000000000000',49,
  ]);
 });
});
