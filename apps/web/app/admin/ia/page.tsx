import {
 AdminAccessState,AdminCollection,AdminPageHeader,Metric,
} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';

type Row=Record<string,unknown>;
type AIBudget=Row&{
 workload_key:string;day_cost_usd:string;month_cost_usd:string;
 daily_budget_usd:string|null;monthly_budget_usd:string|null;
};
type AIExecutions={items:Row[];attempts:Row[];budgets:AIBudget[]};

export default async function Page(){
 const result=await adminApi<AIExecutions>('/admin/ai/executions');
 if(!result.ok)return <AdminAccessState status={result.status}/>;
 return <>
  <AdminPageHeader eyebrow="Inteligência assistida" title="IA Hub"
   description="Observe orçamento, tentativas, fallback, latência e custo estimado dos workloads."/>
  <div className="grid metrics">
   {result.data.budgets.map(b=><Metric key={b.workload_key}
    label={`${b.workload_key} · hoje`}
    value={`${money(b.day_cost_usd)} / ${money(b.daily_budget_usd)}`}/>) }
  </div>
  <AdminPageHeader compact eyebrow="Consumo consolidado" title="Execuções"
   description="Uma execução pode conter mais de uma tentativa quando há fallback."/>
  <AdminCollection result={{ok:true,data:{items:result.data.items}}} columns={[
   {key:'workload_key',label:'Workload'},{key:'provider_key',label:'Provedor'},
   {key:'model_key',label:'Modelo'},{key:'status',label:'Status'},
   {key:'attempt_count',label:'Tentativas'},{key:'latency_ms',label:'Latência (ms)'},
   {key:'estimated_cost_usd',label:'Custo (USD)'},{key:'created_at',label:'Executado'},
  ]}/>
  <AdminPageHeader compact eyebrow="Ledger financeiro" title="Tentativas"
   description="Cada chamada reservada ao provedor é registrada, inclusive falhas e respostas inválidas."/>
  <AdminCollection result={{ok:true,data:{items:result.data.attempts}}} columns={[
   {key:'execution_id',label:'Execução'},{key:'attempt_no',label:'#'},
   {key:'provider_key',label:'Provedor'},{key:'model_key',label:'Modelo'},
   {key:'status',label:'Status'},{key:'reserved_cost_usd',label:'Reservado (USD)'},
   {key:'estimated_cost_usd',label:'Real estimado (USD)'},
   {key:'error_code',label:'Erro'},{key:'created_at',label:'Início'},
  ]} empty="Nenhuma tentativa de IA registrada."/>
 </>;
}

function money(value:string|null){
 const amount=Number(value??0);
 return new Intl.NumberFormat('en-US',{
  style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:4,
 }).format(Number.isFinite(amount)?amount:0);
}
