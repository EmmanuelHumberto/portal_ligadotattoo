import {BadRequestException} from '@nestjs/common';
import {describe,expect,it} from 'vitest';
import {registerMediaInput,setMediaRightsInput} from '../src/media/admin-media.input';

describe('admin media runtime input',()=>{
  it('normalizes registration and rights decisions',()=>{
    expect(registerMediaInput({kind:' image ',storageKey:'originals/a.jpg',
      mimeType:'IMAGE/JPEG',byteSize:42,sha256:'A'.repeat(64)})).toEqual({
      kind:'IMAGE',storageKey:'originals/a.jpg',mimeType:'image/jpeg',byteSize:42,
      sha256:'a'.repeat(64),
    });
    expect(setMediaRightsInput({expectedVersion:2,rightsStatus:' permitted ',
      basis:' autorização ',sourceUrl:'https://example.com/license'})).toMatchObject({
      expectedVersion:2,status:'PERMITTED',basis:'autorização',
      sourceUrl:'https://example.com/license',
    });
  });

  it('rejects permission without basis and malformed storage metadata',()=>{
    expect(()=>setMediaRightsInput({expectedVersion:1,rightsStatus:'PERMITTED'}))
      .toThrow(BadRequestException);
    expect(()=>registerMediaInput({kind:'IMAGE',storageKey:'../secret',
      mimeType:'image/jpeg',byteSize:1,sha256:'a'.repeat(64)}))
      .toThrow(BadRequestException);
    expect(()=>setMediaRightsInput({expectedVersion:1,rightsStatus:'ACTIVE'}))
      .toThrow(BadRequestException);
  });
});
