import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';
type Rows={items:Record<string,unknown>[]};
export default async function Page(){
 const result=await adminApi<Rows>('/admin/listings');
 return <><AdminPageHeader eyebrow="Monetização" title="Comércio" description="Acompanhe anúncios, vendedores, preços recentes e disponibilidade."/>
  <AdminCollection result={result} columns={[{key:'product_name',label:'Produto'},{key:'seller_name',label:'Vendedor'},{key:'status',label:'Status'},{key:'latest_amount',label:'Preço'},{key:'latest_currency',label:'Moeda'},{key:'availability',label:'Disponibilidade'},{key:'last_observed_at',label:'Observado'}]}/></>;
}
