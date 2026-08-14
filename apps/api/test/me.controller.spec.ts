import {describe,expect,it} from 'vitest';
import {MeController} from '../src/iam/me.controller';

describe('me controller',()=>{
  it('projects the authenticated actor without secrets',()=>{
    const ctrl=new MeController();
    const actor={
      actorId:'a-1',externalSubject:'sub-1',
      capabilities:new Set(['editorial.write','claim.read']),
      authenticationLevel:'oidc',
    };
    expect(ctrl.me(actor as any)).toEqual({
      actorId:'a-1',externalSubject:'sub-1',
      capabilities:['claim.read','editorial.write'],
      authenticationLevel:'oidc',
    });
  });

  it('returns empty capabilities for a missing actor',()=>{
    const ctrl=new MeController();
    expect(ctrl.me(undefined)).toEqual({
      actorId:undefined,externalSubject:undefined,
      capabilities:[],authenticationLevel:undefined,
    });
  });
});
