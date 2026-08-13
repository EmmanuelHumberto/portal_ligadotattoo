import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';
type Rows={items:Record<string,unknown>[]};
export default async function Page(){
 const result=await adminApi<Rows>('/admin/claims');
 return <><AdminPageHeader eyebrow="Governança de dados" title="Conhecimento" description="Inspecione alegações, evidências e confiança antes da canonização."/>
  <AdminCollection result={result} columns={[{key:'subject_type',label:'Sujeito'},{key:'property_key',label:'Propriedade'},{key:'value',label:'Valor'},{key:'confidence',label:'Confiança'},{key:'status',label:'Status'},{key:'observed_at',label:'Observado'}]}/></>;
}
