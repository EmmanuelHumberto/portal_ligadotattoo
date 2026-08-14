import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {AdminActionForm} from '../../../components/admin-action-form';
import {adminApi} from '../../../lib/admin-api';
import {createProduct} from './actions';

type Rows={items:Record<string,unknown>[]};

const TYPES=['PEN','ROTARY','COIL','CARTRIDGE','INK','BATTERY','POWER_SUPPLY','ACCESSORY'];

export default async function Page({searchParams}:{searchParams:Promise<{type?:string}>}){
 const {type}=await searchParams;
 const typeParam=type?`?type=${encodeURIComponent(type)}`:'';
 const result=await adminApi<Rows>(`/admin/products${typeParam}`);
 return <>
  <AdminPageHeader eyebrow="Catálogo" title="Produtos" description="Modelos de máquina e equipamentos do catálogo."/>
  <nav className="adminFilterBar" aria-label="Filtrar por tipo">
   <a className={!type?'is-active':''} href="/admin/produtos">Todos</a>
   {TYPES.map(t=>(
    <a key={t} className={type===t?'is-active':''} href={`/admin/produtos?type=${t}`}>{t}</a>
   ))}
  </nav>
  <AdminActionForm action={createProduct} className="card adminForm">
   <h2>Novo produto</h2>
   <div className="adminFields">
    <label>Fabricante (uuid)<input name="manufacturerId" required placeholder="00000000-0000-0000-0000-000000000000"/></label>
    <label>Tipo de produto<input name="productTypeKey" required placeholder="PEN"/></label>
    <label>Nome<input name="name" required placeholder="Ex.: Fixture Pen"/></label>
    <label>Slug<input name="slug" required pattern="[a-z0-9-]+" placeholder="fixture-pen"/></label>
    <label>Código do modelo<input name="modelCode" placeholder="Opcional"/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Criar produto</button>
   </div>
  </AdminActionForm>
  <AdminCollection result={result}
   hrefFor={row=>`/admin/produtos/${String(row.id)}`}
   columns={[
   {key:'name',label:'Nome'},
   {key:'product_type_key',label:'Tipo'},
   {key:'manufacturer_name',label:'Fabricante'},
   {key:'model_code',label:'Modelo'},
   {key:'lifecycle',label:'Ciclo'},
   {key:'version',label:'Versão'},
   {key:'updated_at',label:'Atualizado'},
  ]}/>
 </>;
}
