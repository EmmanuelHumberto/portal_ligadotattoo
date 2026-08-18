import {BadRequestException} from '@nestjs/common';
import {describe,expect,it,vi} from 'vitest';
import {ProblemDetailsFilter} from '../src/platform/problem-details.filter';

describe('ProblemDetailsFilter',()=>{
  it('returns stable problem details and preserves a safe request id',()=>{
    const send=vi.fn();
    const type=vi.fn(()=>({send}));
    const status=vi.fn(()=>({type}));
    const setHeader=vi.fn();
    const http={
      getRequest:()=>({headers:{'x-request-id':'request-123'}}),
      getResponse:()=>({status,setHeader}),
    };
    new ProblemDetailsFilter().catch(
      new BadRequestException('Invalid payload'),
      {switchToHttp:()=>http} as never,
    );
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-Id','request-123');
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      status:400,correlationId:'request-123',detail:'Invalid payload',
    }));
  });

  it('does not expose internal exception details',()=>{
    const send=vi.fn();
    const response={
      setHeader:vi.fn(),status:vi.fn(()=>({
        type:vi.fn(()=>({send})),
      })),
    };
    new ProblemDetailsFilter().catch(new Error('database password leaked'),{
      switchToHttp:()=>({
        getRequest:()=>({headers:{}}),getResponse:()=>response,
      }),
    } as never);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      status:500,detail:undefined,
    }));
  });

  it.each([
    ['NotFoundError',404],['ConcurrentModificationError',409],
  ])('maps the domain error %s to HTTP %s',(name,expectedStatus)=>{
    const send=vi.fn();
    const status=vi.fn(()=>({type:vi.fn(()=>({send}))}));
    const error=Object.assign(new Error('Domain failure'),{name});
    new ProblemDetailsFilter().catch(error,{
      switchToHttp:()=>({
        getRequest:()=>({headers:{}}),
        getResponse:()=>({setHeader:vi.fn(),status}),
      }),
    } as never);
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      status:expectedStatus,detail:'Domain failure',code:name.replace(/([a-z])([A-Z])/g,'$1_$2').toUpperCase(),
    }));
  });
});
