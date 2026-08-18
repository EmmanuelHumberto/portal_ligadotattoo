import {afterEach,describe,expect,it,vi} from 'vitest';
import {AIProviderHubService} from '../src/ai/provider-hub.service';

const route={key:'deepseek',provider_key:'deepseek',provider_model_id:'model',
  input_cost_per_million:0.14,output_cost_per_million:0.28,
  max_input_tokens:128000,max_output_tokens:4000};
const policy={routes:[route],max_attempts:1,timeout_ms:1000,
  max_output_tokens:1000,max_estimated_cost_usd:0.01,
  daily_budget_usd:1,monthly_budget_usd:20,response_format:'json'};

describe('AIProviderHubService governance',()=>{
  afterEach(()=>delete process.env.AI_PAID_FALLBACK_ENABLED);
  it('reserves budget before calling the provider and closes both ledgers',async()=>{
    const order:string[]=[];
    const adapter={key:'deepseek',execute:vi.fn(async()=>{
      order.push('provider');return {text:'{"ok":true}',inputTokens:10,outputTokens:5};
    })};
    const ledger={
      start:vi.fn(async()=>{order.push('start');}),
      reserve:vi.fn(async()=>{order.push('reserve');return {attemptId:'attempt',reservedCost:0.01};}),
      finishAttempt:vi.fn(async()=>{order.push('attempt');}),
      finishExecution:vi.fn(async()=>{order.push('execution');}),
    };
    const hub=new AIProviderHubService([adapter] as never,
      {policy:vi.fn(async()=>policy)} as never,ledger as never);
    await expect(hub.execute({workload:'editorial.draft',input:{text:'source'},
      correlationId:'8e6fda3a-1984-4d9f-9e2c-7b77ac613c5c'}))
      .resolves.toMatchObject({output:{ok:true},providerKey:'deepseek'});
    expect(order).toEqual(['start','reserve','provider','attempt','execution']);
  });

  it('does not call the provider when the ledger refuses the budget',async()=>{
    const adapter={key:'deepseek',execute:vi.fn()};
    const ledger={start:vi.fn(),reserve:vi.fn(async()=>{
      throw Object.assign(new Error('AI_DAILY_BUDGET_EXCEEDED'),{name:'AIBudgetError'});
    }),finishAttempt:vi.fn(),finishExecution:vi.fn()};
    const hub=new AIProviderHubService([adapter] as never,
      {policy:vi.fn(async()=>policy)} as never,ledger as never);
    await expect(hub.execute({workload:'catalog.translate',input:{text:'source'},
      correlationId:'8e6fda3a-1984-4d9f-9e2c-7b77ac613c5c'}))
      .rejects.toThrow('AI_DAILY_BUDGET_EXCEEDED');
    expect(adapter.execute).not.toHaveBeenCalled();
    expect(ledger.finishExecution).toHaveBeenCalledWith(expect.objectContaining({
      status:'FAILED',
    }));
  });

  it('rejects invalid JSON, records the paid attempt and uses the next route',async()=>{
    const fallbackRoute={...route,key:'fallback'};
    const first={key:'deepseek',execute:vi.fn(async()=>({
      text:'not-json',inputTokens:20,outputTokens:4,
    }))};
    const fallback={key:'fallback-provider',execute:vi.fn(async()=>({
      text:'{"ok":true}',inputTokens:15,outputTokens:3,
    }))};
    const reserve=vi.fn(async({attemptNo}:{attemptNo:number})=>({
      attemptId:`attempt-${attemptNo}`,reservedCost:0.01,
    }));
    const ledger={start:vi.fn(),reserve,finishAttempt:vi.fn(),finishExecution:vi.fn()};
    const hub=new AIProviderHubService([first,fallback] as never,
      {policy:vi.fn(async()=>({...policy,max_attempts:2,routes:[
        route,{...fallbackRoute,provider_key:'fallback-provider'},
      ]}))} as never,ledger as never);

    await expect(hub.execute({workload:'editorial.draft',input:{text:'source'},
      correlationId:'8e6fda3a-1984-4d9f-9e2c-7b77ac613c5c'}))
      .resolves.toMatchObject({output:{ok:true},modelKey:'fallback'});
    expect(ledger.finishAttempt).toHaveBeenNthCalledWith(1,
      expect.objectContaining({attemptId:'attempt-1',status:'FAILED',
        error:expect.objectContaining({message:'AI_INVALID_JSON_RESPONSE'})}));
    expect(ledger.finishAttempt).toHaveBeenNthCalledWith(2,
      expect.objectContaining({attemptId:'attempt-2',status:'SUCCEEDED'}));
  });

  it('keeps paid adapters registered but skips them when cost fallback is disabled',async()=>{
    process.env.AI_PAID_FALLBACK_ENABLED='false';
    const localRoute={...route,key:'local',provider_key:'ollama',
      input_cost_per_million:0,output_cost_per_million:0};
    const local={key:'ollama',execute:vi.fn(async()=>{throw new Error('offline');})};
    const paid={key:'deepseek',execute:vi.fn(async()=>({text:'{"ok":true}'}))};
    const ledger={start:vi.fn(),reserve:vi.fn(async()=>({attemptId:'attempt'})),
      finishAttempt:vi.fn(),finishExecution:vi.fn()};
    const hub=new AIProviderHubService([local,paid] as never,
      {policy:vi.fn(async()=>({...policy,max_attempts:2,routes:[localRoute,route]}))} as never,
      ledger as never);

    await expect(hub.execute({workload:'editorial.draft',input:{text:'source'},
      correlationId:'8e6fda3a-1984-4d9f-9e2c-7b77ac613c5c'}))
      .rejects.toThrow('offline');
    expect(local.execute).toHaveBeenCalledOnce();
    expect(paid.execute).not.toHaveBeenCalled();
  });
});
