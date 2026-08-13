import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';
type Rows={items:Record<string,unknown>[]};
export default async function Page(){
 const result=await adminApi<Rows>('/admin/media');
 return <><AdminPageHeader eyebrow="Biblioteca" title="Mídia" description="Confira ativos, variantes e situação dos direitos de uso."/>
  <AdminCollection result={result} columns={[{key:'kind',label:'Tipo'},{key:'mime_type',label:'Formato'},{key:'rights_status',label:'Direitos'},{key:'status',label:'Status'},{key:'variant_count',label:'Variantes'},{key:'updated_at',label:'Atualizado'}]}/></>;
}
