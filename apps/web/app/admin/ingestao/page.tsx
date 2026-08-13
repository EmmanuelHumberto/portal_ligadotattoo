import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';
type Rows={items:Record<string,unknown>[]};
export default async function Page(){
 const result=await adminApi<Rows>('/admin/ingestion/runs');
 return <><AdminPageHeader eyebrow="Aquisição segura" title="Ingestão" description="Monitore execuções das fontes e os resultados de cada coleta."/>
  <AdminCollection result={result} columns={[{key:'source_name',label:'Fonte'},{key:'status',label:'Status'},{key:'deduplicated',label:'Duplicado'},{key:'error_code',label:'Erro'},{key:'started_at',label:'Início'},{key:'finished_at',label:'Fim'}]}/></>;
}
