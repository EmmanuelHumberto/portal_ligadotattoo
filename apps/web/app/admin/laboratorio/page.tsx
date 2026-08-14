import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';

type Rows={items:Record<string,unknown>[]};

export default async function Page(){
 const result=await adminApi<Rows>('/admin/laboratory/sessions');
 return <>
  <AdminPageHeader eyebrow="Laboratório" title="Sessões de medição" description="Sessões de medição, metodologias e status de processamento."/>
  <AdminCollection result={result} columns={[
   {key:'product_name',label:'Produto'},
   {key:'methodology_key',label:'Metodologia'},
   {key:'methodology_version',label:'Versão metodologia'},
   {key:'status',label:'Status'},
   {key:'performed_by',label:'Executado por'},
   {key:'version',label:'Versão'},
   {key:'updated_at',label:'Atualizado'},
  ]}/>
 </>;
}
