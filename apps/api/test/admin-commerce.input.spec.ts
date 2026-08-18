import {BadRequestException} from '@nestjs/common';
import {describe,expect,it} from 'vitest';
import {listingUrlInput,priceInput} from '../src/commerce/admin-commerce.input';

describe('admin commerce runtime input',()=>{
  it('normalizes price observations and listing URLs',()=>{
    expect(priceInput({amount:19.9,currency:' brl ',availability:'in_stock'}))
      .toMatchObject({amount:19.9,currency:'BRL',availability:'IN_STOCK'});
    expect(listingUrlInput({url:'https://shop.example/item#details'}))
      .toBe('https://shop.example/item');
  });
  it('rejects malformed price and credential-bearing URLs',()=>{
    expect(()=>priceInput({amount:'19.9',currency:'BRL'})).toThrow(BadRequestException);
    expect(()=>priceInput({amount:10,currency:'BRL',availability:'YES'}))
      .toThrow(BadRequestException);
    expect(()=>listingUrlInput({url:'https://user:pass@shop.example/item'}))
      .toThrow(BadRequestException);
  });
});
