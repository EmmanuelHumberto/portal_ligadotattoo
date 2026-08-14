import {AdminAccessState,AdminPageHeader} from '../../../../components/admin-resource';
import {AdminActionForm} from '../../../../components/admin-action-form';
import {adminApi} from '../../../../lib/admin-api';
import {specGroupsFor} from '../../../../lib/spec-schema';
import {renameProduct,saveListingUrl,saveProductSpecs,setProductType,updateProductMeta,uploadProductImage} from '../actions';

type Detail={
 id:string;name:string;slug:string;product_type_key:string;
 manufacturer_name:string;model_code?:string|null;lifecycle?:string|null;
 release_date?:string|null;discontinued_date?:string|null;media_id?:string|null;
 listing_id?:string|null;listing_url?:string|null;
 specs?:Array<{property_key:string;value:unknown;unit:string|null}>;
};

function factText(v:unknown):string{
 if(v==null)return '';
 const s=String(v);
 try{
  const parsed=JSON.parse(s);
  if(typeof parsed==='string')return parsed;
  if(typeof parsed==='number'||typeof parsed==='boolean')return String(parsed);
  return s;
 }catch{return s;}
}

export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const result=await adminApi<Detail>(`/admin/products/${id}`);
 if(!result.ok)return <>
  <AdminPageHeader eyebrow="Catálogo" title="Produto" description="Detalhe do produto."/>
  <AdminAccessState status={result.status}/>
 </>;
 const p=result.data;
 const specMap:Record<string,string>={};
 for(const s of p.specs??[])specMap[s.property_key]=factText(s.value);
 return <>
  <AdminPageHeader eyebrow="Catálogo" title={p.name}
   description={`${p.manufacturer_name} · ${p.product_type_key}${p.model_code?` · ${p.model_code}`:''}`}/>

  <AdminActionForm action={renameProduct} className="card adminForm">
   <h2>Nome do produto</h2>
   <p className="muted">Corrija o nome/título exibido. O slug (URL) permanece o mesmo.</p>
   <input type="hidden" name="id" value={p.id}/>
   <div className="adminFields">
    <label>Nome<input name="name" defaultValue={p.name} required/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Renomear</button>
   </div>
  </AdminActionForm>

  <AdminActionForm action={setProductType} className="card adminForm">
   <h2>Reclassificar tipo</h2>
   <p className="muted">Corrija a categoria pontualmente, sem rodar a descoberta. A decisão fica registrada e a busca é re-sincronizada.</p>
   <input type="hidden" name="id" value={p.id}/>
   <div className="adminFields">
    <label>Tipo atual: <strong>{p.product_type_key}</strong></label>
    <label>Novo tipo
     <select name="productTypeKey" defaultValue={p.product_type_key}>
      <option value="PEN">PEN — máquina pen</option>
      <option value="ROTARY">ROTARY — rotativa</option>
      <option value="COIL">COIL — bobina</option>
      <option value="CARTRIDGE">CARTRIDGE — cartucho</option>
      <option value="INK">INK — tinta</option>
      <option value="BATTERY">BATTERY — bateria</option>
      <option value="POWER_SUPPLY">POWER_SUPPLY — fonte</option>
      <option value="ACCESSORY">ACCESSORY — acessório</option>
     </select>
    </label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Reclassificar</button>
   </div>
  </AdminActionForm>

  <AdminActionForm action={updateProductMeta} className="card adminForm">
   <h2>Metadados</h2>
   <p className="muted">Código do modelo, ciclo de vida e datas do produto.</p>
   <input type="hidden" name="id" value={p.id}/>
   <div className="adminFields">
    <label>Código do modelo<input name="modelCode" defaultValue={p.model_code??''}/></label>
    <label>Ciclo de vida
     <select name="lifecycle" defaultValue={p.lifecycle??'ACTIVE'}>
      <option value="ANNOUNCED">ANNOUNCED — anunciado</option>
      <option value="ACTIVE">ACTIVE — ativo</option>
      <option value="DISCONTINUED">DISCONTINUED — descontinuado</option>
      <option value="LEGACY">LEGACY — legado</option>
      <option value="UNKNOWN">UNKNOWN — desconhecido</option>
     </select>
    </label>
    <label>Data de lançamento<input name="releaseDate" type="date" defaultValue={p.release_date??''}/></label>
    <label>Data de descontinuação<input name="discontinuedDate" type="date" defaultValue={p.discontinued_date??''}/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Salvar metadados</button>
   </div>
  </AdminActionForm>

  <AdminActionForm action={uploadProductImage} className="card adminForm">
   <h2>Imagem do produto</h2>
   <p className="muted">Envie a imagem correta do produto. Ela aparece no catálogo público.</p>
   <input type="hidden" name="id" value={p.id}/>
   <div className="adminFields">
    <label>Imagem (JPG/PNG/WebP, até 25MB)
     <input type="file" name="file" accept="image/*" required/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Enviar imagem</button>
   </div>
  </AdminActionForm>

  <AdminActionForm action={saveProductSpecs} className="card adminForm">
   <h2>Ficha técnica</h2>
   <p className="muted">Campos por categoria. Preencha com as especificações reais do equipamento.</p>
   <input type="hidden" name="id" value={p.id}/>
   <input type="hidden" name="productType" value={p.product_type_key}/>
   <div className="adminFields">
    <label>Resumo<textarea name="summary" rows={2} placeholder="Resumo curto do produto"/></label>
    <label>Descrição<textarea name="description" rows={2} placeholder="Descrição detalhada"/></label>
   </div>
   {specGroupsFor(p.product_type_key).map(g=>(
    <fieldset key={g.title} className="specGroup">
     <h3>{g.title}</h3>
     <div className="adminFields">
      {g.fields.map(f=>(
       <label key={f.key}>{f.label}{f.unit?` (${f.unit})`:''}
        <input name={f.key} defaultValue={specMap[f.key] ?? ''} placeholder={f.placeholder}/>
       </label>
      ))}
     </div>
    </fieldset>
   ))}
   <div className="adminActions">
    <button className="primary" type="submit">Salvar ficha técnica</button>
   </div>
  </AdminActionForm>

  {p.listing_id&&<AdminActionForm action={saveListingUrl} className="card adminForm">
   <h2>Link externo</h2>
   <p className="muted">URL da página original do produto no site do fabricante/loja.</p>
   <input type="hidden" name="listingId" value={p.listing_id}/>
   <div className="adminFields">
    <label>URL<input name="url" defaultValue={p.listing_url??''} placeholder="https://..." required/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Salvar link</button>
   </div>
  </AdminActionForm>}
 </>;
}
