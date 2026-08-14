import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {AdminActionForm} from '../../../components/admin-action-form';
import {adminApi} from '../../../lib/admin-api';
import {recordPrice} from './actions';

type Rows={items:Record<string,unknown>[]};

export default async function Page(){
 const result=await adminApi<Rows>('/admin/listings');
 return <>
  <AdminPageHeader eyebrow="Monetização" title="Comércio" description="Acompanhe anúncios, vendedores, preços recentes e disponibilidade."/>
  <AdminActionForm action={recordPrice} className="card adminForm">
   <h2>Registrar preço</h2>
   <div className="adminFields">
    <label>Anúncio (uuid)<input name="listingId" required placeholder="00000000-0000-0000-0000-000000000000"/></label>
    <label>Valor<input name="amount" type="number" min="0" step="0.01" required placeholder="1299.90"/></label>
    <label>Moeda<input name="currency" required placeholder="BRL" maxLength={3}/></label>
    <label>Disponibilidade
     <select name="availability" defaultValue="IN_STOCK">
      <option value="IN_STOCK">Em estoque</option>
      <option value="OUT_OF_STOCK">Esgotado</option>
      <option value="PREORDER">Pré-venda</option>
      <option value="UNAVAILABLE">Indisponível</option>
      <option value="UNKNOWN">Desconhecido</option>
     </select>
    </label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Registrar preço</button>
   </div>
  </AdminActionForm>
  <AdminCollection result={result} columns={[
   {key:'product_name',label:'Produto'},
   {key:'seller_name',label:'Vendedor'},
   {key:'status',label:'Status'},
   {key:'latest_amount',label:'Preço'},
   {key:'latest_currency',label:'Moeda'},
   {key:'availability',label:'Disponibilidade'},
   {key:'version',label:'Versão'},
   {key:'last_observed_at',label:'Observado'},
  ]}/>
 </>;
}
