import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';

type Rows={items:Record<string,unknown>[]};

export default async function Page(){
 const result=await adminApi<Rows>('/admin/technical-issues');
 return <>
  <AdminPageHeader eyebrow="Serviço técnico" title="Problemas técnicos" description="Problemas reportados, em análise e validados tecnicamente."/>
  <AdminCollection result={result} columns={[
   {key:'title',label:'Título'},
   {key:'issue_type',label:'Tipo'},
   {key:'status',label:'Status'},
   {key:'severity',label:'Severidade'},
   {key:'public_visibility',label:'Visibilidade'},
   {key:'version',label:'Versão'},
   {key:'updated_at',label:'Atualizado'},
  ]}/>
 </>;
}
