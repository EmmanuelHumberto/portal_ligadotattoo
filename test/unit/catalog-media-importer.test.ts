import {describe,expect,it,vi} from 'vitest';
import {CatalogMediaImporter} from '../../apps/worker/src/commerce/catalog-media.importer';

describe('CatalogMediaImporter',()=>{
  it('stores discovered media in pending rights review',async()=>{
    const query=vi.fn(async()=>({rowCount:1,rows:[]}));
    const acquire=vi.fn(async()=>({finalUrl:'https://maker.test/image.png',status:200,
      contentType:'image/png; charset=binary',body:Buffer.from('png'),sha256:'ignored'}));
    const send=vi.fn(async()=>({}));
    const importer=new CatalogMediaImporter(
      {query} as never,{acquire} as never,{send} as never,'portal-media',async()=>{},
    );
    expect(await importer.importPending('http://maker.test/image.png','Maker'))
      .toMatch(/^[0-9a-f-]{36}$/);
    expect(acquire).toHaveBeenCalledWith(expect.objectContaining({
      url:'https://maker.test/image.png',maxBytes:8_000_000,
    }));
    expect(send).toHaveBeenCalledOnce();
    const sql=query.mock.calls.map(call=>String(call[0])).join('\n');
    expect(sql).toContain("'PENDING','ACTIVE'");
    expect(sql).toContain("'PENDING','REVIEW_REQUIRED'");
    expect(sql).not.toContain("'PERMITTED'");
  });
});
