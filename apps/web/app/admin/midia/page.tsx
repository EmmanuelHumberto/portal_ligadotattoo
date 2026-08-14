import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {AdminActionForm} from '../../../components/admin-action-form';
import {adminApi} from '../../../lib/admin-api';
import {setMediaRights} from './actions';

type Rows={items:Record<string,unknown>[]};

export default async function Page(){
 const result=await adminApi<Rows>('/admin/media');
 return <>
  <AdminPageHeader eyebrow="Biblioteca" title="Mídia" description="Confira ativos, variantes e situação dos direitos de uso."/>
  <AdminActionForm action={setMediaRights} className="card adminForm">
   <h2>Definir direitos</h2>
   <div className="adminFields">
    <label>Ativo (uuid)<input name="id" required placeholder="00000000-0000-0000-0000-000000000000"/></label>
    <label>Versão (expectedVersion)<input name="expectedVersion" type="number" min="1" required placeholder="1"/></label>
    <label>Status de direitos
     <select name="rightsStatus" defaultValue="PERMITTED">
      <option value="UNKNOWN">Desconhecido</option>
      <option value="PENDING">Pendente</option>
      <option value="PERMITTED">Permitido</option>
      <option value="RESTRICTED">Restrito</option>
      <option value="EXPIRED">Expirado</option>
      <option value="TAKEDOWN">Remoção</option>
     </select>
    </label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Aplicar direitos</button>
   </div>
  </AdminActionForm>
  <AdminCollection result={result} columns={[
   {key:'id',label:'ID'},
   {key:'kind',label:'Tipo'},
   {key:'mime_type',label:'Formato'},
   {key:'rights_status',label:'Direitos'},
   {key:'status',label:'Status'},
   {key:'version',label:'Versão'},
   {key:'variant_count',label:'Variantes'},
  ]}/>
 </>;
}
