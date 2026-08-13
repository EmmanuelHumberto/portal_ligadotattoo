import {describe,expect,it,vi} from 'vitest';
import {PublicManufacturerQuery} from '../src/catalog/public-manufacturer.query';
import {EditorialQuery} from '../src/editorial/editorial.query';
import {PublicSearchQuery} from '../src/search/public-search.query';
import {CommerceQuery} from '../src/commerce/commerce.query';

describe('public discovery queries',()=>{
 it('returns structured search suggestions with navigable URLs',async()=>{
  const pool={query:vi.fn().mockResolvedValue({rows:[{
   id:'id-1',document_type:'PRODUCT',title:'Fixture Pen',
   public_url:'/maquinas/fixture-pen',
  }]})};
  await expect(new PublicSearchQuery(pool as any).suggest('Fi')).resolves.toEqual({
   items:[{id:'id-1',type:'PRODUCT',title:'Fixture Pen',
    url:'/maquinas/fixture-pen'}],
  });
 });

 it('maps public manufacturer counts and safe field names',async()=>{
  const pool={query:vi.fn().mockResolvedValue({rowCount:1,rows:[{
   id:'id-1',name:'Fixture Labs',slug:'fixture-labs',country_code:'BR',
   official_website:'https://example.com',product_count:'2',
  }]})};
  await expect(new PublicManufacturerQuery(pool as any).bySlug('fixture-labs'))
   .resolves.toMatchObject({name:'Fixture Labs',countryCode:'BR',productCount:2});
 });

  it('includes governed event details in published editorial content',async()=>{
  const pool={query:vi.fn().mockResolvedValue({rows:[{
   id:'id-1',content_type:'EVENT',slug:'fixture-event',title:'Fixture Event',
   body_document:{version:1,blocks:[]},published_at:'2026-08-13T00:00:00Z',
   starts_at:'2026-09-13T00:00:00Z',timezone:'America/Sao_Paulo',
   event_status:'SCHEDULED',
  }]})};
  const result=await new EditorialQuery(pool as any).publicList('EVENT');
  expect(result.items[0]).toMatchObject({
   contentType:'EVENT',event:{startsAt:'2026-09-13T00:00:00Z',status:'SCHEDULED'},
  });
 });

 it('publishes only fresh offers through the affiliate boundary',async()=>{
   const pool={query:vi.fn().mockResolvedValue({rows:[{
    listing_id:'f1000000-0000-4000-8000-000000000301',
    product_id:'product-1',product_slug:'fixture-pen',
    product_name:'Fixture Pen',product_type_key:'PEN',
    manufacturer_name:'Fixture Labs',manufacturer_slug:'fixture-labs',
    seller:'Fixture Supply',amount:'1299.90',currency:'BRL',
    availability:'IN_STOCK',observed_at:'2026-08-13T00:00:00Z',
   }]})};
   const result=await new CommerceQuery(pool as any).publicOfferFeed({limit:24});
   expect(result.items[0]).toMatchObject({
    amount:1299.9,outboundUrl:'/go/listing/f1000000-0000-4000-8000-000000000301',
    product:{slug:'fixture-pen',manufacturer:{slug:'fixture-labs'}},
   });
   expect(pool.query.mock.calls[0]?.[0]).toContain(
    "po.observed_at>=now()-s.public_freshness_interval",
   );
 });
});
