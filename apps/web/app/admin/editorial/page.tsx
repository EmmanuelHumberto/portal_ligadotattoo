import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';
type Rows={items:Record<string,unknown>[]};
export default async function Page(){
 const result=await adminApi<Rows>('/admin/editorial');
 return <><AdminPageHeader eyebrow="Conteúdo" title="Editorial" description="Acompanhe pautas, revisão, agendamento e publicação."/>
  <AdminCollection result={result} columns={[{key:'title',label:'Título'},{key:'content_type',label:'Tipo'},{key:'status',label:'Status'},{key:'origin',label:'Origem'},{key:'updated_at',label:'Atualizado'}]}/></>;
}
