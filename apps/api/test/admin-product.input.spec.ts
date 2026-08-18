import {BadRequestException} from '@nestjs/common';
import {describe,expect,it} from 'vitest';
import {
  discoveryInput,productCreateInput,productMetaInput,productSpecsInput,
  productTypeInput,
} from '../src/catalog/admin-product.input';

describe('admin product runtime input',()=>{
  it('normalizes valid product mutations',()=>{
    expect(productTypeInput({productTypeKey:' pen '})).toBe('PEN');
    expect(productMetaInput({lifecycle:'active',modelCode:''})).toEqual({
      lifecycle:'ACTIVE',modelCode:null,
    });
    expect(discoveryInput({manufacturerSlug:' maker ',machinesOnly:'true'}))
      .toEqual({manufacturerSlug:'maker',machinesOnly:true});
  });

  it('rejects malformed identifiers, dates and specs',()=>{
    expect(()=>productCreateInput({manufacturerId:'not-uuid',
      productTypeKey:'PEN',name:'Machine',slug:'machine'}))
      .toThrow(BadRequestException);
    expect(()=>productMetaInput({releaseDate:'2026-99-99'}))
      .toThrow(BadRequestException);
    expect(()=>productSpecsInput({specs:{key:'stroke',value:'4 mm'}}))
      .toThrow(BadRequestException);
    expect(()=>productSpecsInput({specs:[{key:'stroke'}]}))
      .toThrow(BadRequestException);
  });
});
