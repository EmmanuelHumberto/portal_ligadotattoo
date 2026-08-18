import {describe,expect,it,vi} from 'vitest';
import {CatalogAuthorityProposalWriter} from '../../apps/worker/src/commerce/catalog-authority-proposal.writer';
import {CatalogProductDiscoveryWriter} from '../../apps/worker/src/commerce/catalog-product-discovery.writer';

describe('catalog discovery governance',()=>{
  it('creates quarantined products and listings',async()=>{
    const query=vi.fn(async(sql:string)=>{
      if(sql.includes('select id from catalog.product_model'))return {rowCount:0,rows:[]};
      if(sql.includes('insert into catalog.product_model'))return {rowCount:1,rows:[{id:'product-1'}]};
      return {rowCount:1,rows:[]};
    });
    const release=vi.fn();
    const writer=new CatalogProductDiscoveryWriter(
      {connect:vi.fn(async()=>({query,release})),query} as never,
      {importPending:vi.fn()} as never,{propose:vi.fn()} as never,
    );
    await writer.persist(
      {id:'manufacturer-1',slug:'maker',name:'Maker'},
      {name:'Model One',url:'https://maker.test/model-one',category:'PEN'},
    );
    const sql=query.mock.calls.map(call=>String(call[0])).join('\n');
    expect(sql).toContain("null,'UNKNOWN',1");
    expect(sql).toContain("'NONE','UNKNOWN','PAUSED'");
    expect(sql).toContain('begin');
    expect(sql).toContain('commit');
    expect(release).toHaveBeenCalledOnce();
  });

  it('records evidence and a pending proposal without creating a fact',async()=>{
    const query=vi.fn(async(sql:string)=>({
      rowCount:sql.includes('select 1 from knowledge.canonical_proposal')?0:1,
      rows:[],
    }));
    const release=vi.fn();
    const writer=new CatalogAuthorityProposalWriter(
      {connect:vi.fn(async()=>({query,release}))} as never,
    );
    await writer.propose({productId:'product-1',propertyKey:'description',
      value:'Source description',sourceUrl:'https://maker.test/model-one'});
    const sql=query.mock.calls.map(call=>String(call[0])).join('\n');
    expect(sql).toContain("'PENDING'");
    expect(sql).not.toContain("'APPROVED'");
    expect(sql).not.toContain('insert into knowledge.canonical_fact');
    expect(release).toHaveBeenCalledOnce();
  });
});
