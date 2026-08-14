import {AdminCollection,AdminPageHeader} from '../../../../components/admin-resource';
import {adminApi} from '../../../../lib/admin-api';

type Rows={items:Record<string,unknown>[]};

export default async function Page(){
 const result=await adminApi<Rows>('/admin/ai/executions');
 return <>
  <AdminPageHeader eyebrow="IA Hub" title="Execuções" description="Execuções recentes do provedor de IA com latência e custo."/>
  <AdminCollection result={result} columns={[
   {key:'workload_key',label:'Workload'},
   {key:'provider_key',label:'Provedor'},
   {key:'model_key',label:'Modelo'},
   {key:'status',label:'Status'},
   {key:'latency_ms',label:'Latência (ms)'},
   {key:'created_at',label:'Criado'},
  ]}/>
 </>;
}
