import {describe,expect,it} from 'vitest';
import {
  classifyProductType,cleanPageText,cleanProductName,cleanShopifyBody,
  extractMetaDescription,extractProductLinks,extractTechnicalSpecs,slugify,
} from '../../apps/worker/src/commerce/catalog-discovery.parsers';

describe('catalog discovery parsers',()=>{
  it('keeps product links on the manufacturer host and rejects navigation',()=>{
    const html=`<a href="/products/flux-pen">Flux</a>
      <a href="/collections/machines">Collection</a>
      <a href="https://other.test/products/coil">Other</a>`;
    expect(extractProductLinks(html,'https://maker.test'))
      .toEqual(['https://maker.test/products/flux-pen']);
  });

  it('normalizes names, slugs and product categories',()=>{
    expect(cleanProductName('Flux Max – $385.00')).toBe('Flux Max');
    expect(slugify('Máquina Élite')).toBe('maquina-elite');
    expect(classifyProductType('Wireless Tattoo Pen')).toBe('PEN');
    expect(classifyProductType('Black Tattoo Ink 30 ml')).toBe('INK');
    expect(classifyProductType('20 pcs 0.30 RL Cartridge')).toBe('CARTRIDGE');
  });

  it('extracts page descriptions and category-specific specifications',()=>{
    const html='<main><h1>Machine</h1><p>Coreless motor, adjustable stroke 2.5 to 4.0 mm, 1800 mAh.</p></main>';
    expect(cleanPageText(html)).toContain('Coreless motor');
    expect(extractMetaDescription('<meta name="description" content="Official machine">'))
      .toBe('Official machine');
    expect(extractTechnicalSpecs(cleanPageText(html),'PEN')).toEqual(expect.arrayContaining([
      {key:'stroke',value:'2.5–4.0 mm'},
      {key:'motor_type',value:'Coreless'},
      {key:'battery_capacity',value:'1800 mAh'},
      {key:'stroke_type',value:'Ajustável'},
    ]));
    expect(cleanShopifyBody('<p>Safe <strong>description</strong></p>'))
      .toBe('Safe description');
  });
});
