import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';
type Rows={items:Record<string,unknown>[]};
export default async function Page(){
 const result=await adminApi<Rows>('/admin/audit');
 return <><AdminPageHeader eyebrow="Rastreabilidade" title="Auditoria" description="Consulte ações administrativas com metadados sensíveis redigidos pela API."/>
  <AdminCollection result={result} columns={[{key:'action',label:'Ação'},{key:'actor_id',label:'Ator'},{key:'subject_type',label:'Sujeito'},{key:'subject_id',label:'Identificador'},{key:'reason',label:'Motivo'},{key:'created_at',label:'Data'}]}/></>;
}
