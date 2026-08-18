import {BadRequestException} from '@nestjs/common';
import {describe,expect,it} from 'vitest';
import {
  canonicalDecisionInput,canonicalProposalInput,claimInput,
} from '../src/knowledge/admin-knowledge.input';

const subjectId='8e6fda3a-1984-4d9f-9e2c-7b77ac613c5c';
const evidenceId='4c758dda-e60f-4237-a212-22422ebd08ee';

describe('admin knowledge runtime input',()=>{
  it('normalizes claims, proposals and decisions',()=>{
    expect(claimInput({subjectType:' Product ',subjectId,propertyKey:' weight ',
      value:0,claimantType:' curator ',confidence:0,observedAt:'2026-08-17T12:00:00Z'}))
      .toMatchObject({subjectType:'Product',propertyKey:'weight',value:0,
        claimantType:'curator',confidence:0});
    expect(canonicalProposalInput({subjectType:'Product',subjectId,
      propertyKey:'weight',proposedValue:null,evidenceIds:[evidenceId,evidenceId]}).evidenceIds)
      .toEqual([evidenceId]);
    expect(canonicalDecisionInput({decision:' approve ',reason:' verificado ',expectedVersion:2}))
      .toEqual({decision:'APPROVE',reason:'verificado',expectedVersion:2});
  });

  it('rejects malformed authority-changing inputs',()=>{
    expect(()=>claimInput({subjectType:'Product',subjectId:'bad',propertyKey:'weight',
      value:10,claimantType:'curator'})).toThrow(BadRequestException);
    expect(()=>canonicalProposalInput({subjectType:'Product',subjectId,
      propertyKey:'weight',proposedValue:10,evidenceIds:[]})).toThrow(BadRequestException);
    expect(()=>canonicalDecisionInput({decision:'YES',reason:'ok!',expectedVersion:0}))
      .toThrow(BadRequestException);
  });
});
