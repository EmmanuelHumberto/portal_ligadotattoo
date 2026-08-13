import {describe,expect,it} from 'vitest';
import {fixtureConfig} from '../src/platform/bootstrap-fixtures';

describe('synthetic bootstrap fixtures',()=>{
  it('are disabled unless explicitly requested',()=>{
    expect(fixtureConfig({NODE_ENV:'development'} as NodeJS.ProcessEnv))
      .toEqual({enabled:false});
  });

  it('can be enabled outside production',()=>{
    expect(fixtureConfig({
      NODE_ENV:'test',BOOTSTRAP_FIXTURES:'true',
    } as NodeJS.ProcessEnv)).toEqual({enabled:true});
  });

  it('fail closed in production',()=>{
    expect(()=>fixtureConfig({
      NODE_ENV:'production',BOOTSTRAP_FIXTURES:'true',
    } as NodeJS.ProcessEnv)).toThrow(/cannot be enabled in production/);
  });
});
