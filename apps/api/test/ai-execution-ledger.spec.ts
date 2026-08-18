import {describe,expect,it,vi} from 'vitest';
import {
  AIExecutionLedgerRepository,estimateCost,estimateInputTokens,
} from '../src/ai/ai-execution-ledger.repository';

const route={key:'model',provider_key:'provider',input_cost_per_million:1,
  output_cost_per_million:2,max_input_tokens:1000};

describe('AI execution ledger budgets',()=>{
  it('estimates input and maximum cost before provider execution',()=>{
    expect(estimateInputTokens('system','prompt')).toBeGreaterThan(0);
    expect(estimateCost(route,1_000_000,500_000)).toBe(2);
  });

  it('rejects a per-call budget before opening a transaction',async()=>{
    const connect=vi.fn();
    const ledger=new AIExecutionLedgerRepository({connect} as never);
    await expect(ledger.reserve({executionId:'e',attemptNo:1,workload:'editorial.draft',
      route,policy:{max_estimated_cost_usd:0.001},estimatedInputTokens:1000,
      maxOutputTokens:1000})).rejects.toThrow('AI_CALL_BUDGET_EXCEEDED');
    expect(connect).not.toHaveBeenCalled();
  });

  it('reserves atomically and rejects exhausted daily budgets',async()=>{
    const query=vi.fn(async(sql:string)=>{
      if(sql.includes('select\n           coalesce'))return {rows:[{day_cost:'0.009',month_cost:'0.009'}]};
      return {rows:[],rowCount:1};
    });
    const release=vi.fn();
    const ledger=new AIExecutionLedgerRepository(
      {connect:vi.fn(async()=>({query,release}))} as never,
    );
    await expect(ledger.reserve({executionId:'e',attemptNo:1,workload:'catalog.translate',
      route,policy:{daily_budget_usd:0.01},estimatedInputTokens:1000,
      maxOutputTokens:1000})).rejects.toThrow('AI_DAILY_BUDGET_EXCEEDED');
    expect(query.mock.calls.map(call=>String(call[0])).join('\n'))
      .toContain('pg_advisory_xact_lock');
    expect(query).toHaveBeenCalledWith('rollback');
    expect(release).toHaveBeenCalledOnce();
  });
});
