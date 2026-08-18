import {BadRequestException} from '@nestjs/common';
import {describe,expect,it} from 'vitest';
import {
  aiDraftInput,approvalInput,autoDraftConfigInput,createEditorialInput,
  editorialTopicInput,editorialTopicStatusInput,scheduleInput,socialEditorialInput,
  updateEditorialInput,workflowVersionInput,
} from '../src/editorial/admin-editorial.input';

const id='8e6fda3a-1984-4d9f-9e2c-7b77ac613c5c';

describe('admin editorial runtime input',()=>{
  it('normalizes draft and workflow inputs',()=>{
    expect(createEditorialInput({contentType:' blog ',title:' Novo post ',slug:'novo-post',
      subtitle:'',summary:' resumo ',body:{version:1,blocks:[]}})).toEqual({
      contentType:'BLOG',title:'Novo post',slug:'novo-post',summary:'resumo',
      body:{version:1,blocks:[]},
    });
    expect(updateEditorialInput({title:' Alterado ',body:{version:1,
      blocks:[{type:'heading',level:2,text:' Seção '},{type:'image',mediaId:id}]}}))
      .toMatchObject({title:'Alterado',subtitle:null,summary:null});
    expect(workflowVersionInput({expectedVersion:3})).toBe(3);
    expect(approvalInput({expectedVersion:2,reason:' revisado '}))
      .toEqual({expectedVersion:2,reason:'revisado'});
    expect(scheduleInput({expectedVersion:2,publishAt:'2030-01-01T12:00:00Z'}).publishAt)
      .toBeInstanceOf(Date);
  });

  it('normalizes social ingestion and AI inputs',()=>{
    expect(socialEditorialInput({text:' conteúdo ',mediaIds:[id,id]}))
      .toEqual({url:'',text:'conteúdo',imageUrl:'',mediaIds:[id]});
    expect(aiDraftInput({candidateId:id,requestedType:'news',verbatim:true}))
      .toEqual({candidateId:id,requestedType:'NEWS',verbatim:true});
    expect(autoDraftConfigInput({enabled:false})).toBe(false);
    expect(editorialTopicInput({name:' Máquinas ',query:' tattoo machine '}))
      .toEqual({name:'Máquinas',query:'tattoo machine',language:'pt-BR',maxArticles:5});
    expect(editorialTopicStatusInput({status:' paused '})).toBe('PAUSED');
  });

  it('rejects malformed documents and unsafe workflow values',()=>{
    expect(()=>createEditorialInput({contentType:'BLOG',title:'Post',slug:'Post Inválido',
      body:{version:1,blocks:[]}})).toThrow(BadRequestException);
    expect(()=>updateEditorialInput({title:'Post',body:{version:1,
      blocks:[{type:'script',text:'x'}]}})).toThrow(BadRequestException);
    expect(()=>workflowVersionInput({expectedVersion:'1'})).toThrow(BadRequestException);
    expect(()=>socialEditorialInput({url:'file:///etc/passwd'})).toThrow(BadRequestException);
    expect(()=>aiDraftInput({requestedType:'BLOG'})).toThrow(BadRequestException);
    expect(()=>autoDraftConfigInput({enabled:'false'})).toThrow(BadRequestException);
    expect(()=>editorialTopicInput({name:'x',query:'ok',maxArticles:100}))
      .toThrow(BadRequestException);
  });
});
