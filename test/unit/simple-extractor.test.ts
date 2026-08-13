import {describe,expect,it} from 'vitest';
import {SimpleContentExtractor} from '../../apps/worker/src/simple-extractor';

describe('SimpleContentExtractor',()=>{
 it('extracts readable HTML without executable content',async()=>{
  const extractor=new SimpleContentExtractor();
  const result=await extractor.extract({
   contentType:'text/html',url:'https://example.test/product',
   body:Buffer.from('<title>A &amp; B</title><style>hidden</style><p>Visible text</p><script>alert(1)</script>'),
  });

  expect(result.title).toBe('A & B');
  expect(result.text).toContain('Visible text');
  expect(result.text).not.toContain('hidden');
  expect(result.text).not.toContain('alert');
 });

 it('preserves JSON as structured data',async()=>{
  const extractor=new SimpleContentExtractor();
  const result=await extractor.extract({
   contentType:'application/json',url:'https://example.test/feed',
   body:Buffer.from('{"name":"Machine"}'),
  });

  expect(result.structured).toEqual({document:{name:'Machine'}});
 });
});
