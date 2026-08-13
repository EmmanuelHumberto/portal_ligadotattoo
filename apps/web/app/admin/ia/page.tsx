import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';
type Rows={items:Record<string,unknown>[]};
export default async function Page(){
 const result=await adminApi<Rows>('/admin/ai/executions');
 return <><AdminPageHeader eyebrow="Inteligência assistida" title="IA Hub" description="Observe execuções, latência, custo estimado e falhas dos workloads."/>
  <AdminCollection result={result} columns={[{key:'workload_key',label:'Workload'},{key:'provider_key',label:'Provedor'},{key:'model_key',label:'Modelo'},{key:'status',label:'Status'},{key:'latency_ms',label:'Latência (ms)'},{key:'estimated_cost_usd',label:'Custo (USD)'},{key:'created_at',label:'Executado'}]}/></>;
}
