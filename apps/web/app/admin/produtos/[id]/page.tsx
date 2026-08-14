import {AdminAccessState,AdminPageHeader} from '../../../../components/admin-resource';
import {AdminActionForm} from '../../../../components/admin-action-form';
import {adminApi} from '../../../../lib/admin-api';
import {saveListingUrl,saveProductSpecs,uploadProductImage} from '../actions';

type Detail={
 id:string;name:string;slug:string;product_type_key:string;
 manufacturer_name:string;model_code?:string|null;media_id?:string|null;
 listing_id?:string|null;listing_url?:string|null;
};

export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const result=await adminApi<Detail>(`/admin/products/${id}`);
 if(!result.ok)return <>
  <AdminPageHeader eyebrow="Catálogo" title="Produto" description="Detalhe do produto."/>
  <AdminAccessState status={result.status}/>
 </>;
 const p=result.data;
 return <>
  <AdminPageHeader eyebrow="Catálogo" title={p.name}
   description={`${p.manufacturer_name} · ${p.product_type_key}${p.model_code?` · ${p.model_code}`:''}`}/>

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
   <h2>Resumo e especificações</h2>
   <p className="muted">Preencha com as informações reais do produto (fonte, tensão, RPM, motor, acessórios).</p>
   <input type="hidden" name="id" value={p.id}/>
   <div className="adminFields">
    <label>Resumo<textarea name="summary" rows={2} placeholder="Resumo curto do produto"/></label>
    <label>Descrição<textarea name="description" rows={2} placeholder="Descrição detalhada"/></label>
    <label>Fonte (power supply)<input name="power_supply" placeholder="Ex.: Fonte de bancada"/></label>
    <label>Unidade<input name="power_supply_unit" placeholder="Opcional"/></label>
    <label>Tensão (voltage)<input name="voltage_range" placeholder="Ex.: 5–12"/></label>
    <label>Unidade<input name="voltage_range_unit" defaultValue="V"/></label>
    <label>RPM<input name="rpm" placeholder="Ex.: 8000"/></label>
    <label>Unidade<input name="rpm_unit" defaultValue="rpm"/></label>
    <label>Tipo de motor<input name="motor_type" placeholder="Ex.: Motor brushless"/></label>
    <label>Curso (stroke)<input name="stroke" placeholder="Ex.: 3.5"/></label>
    <label>Unidade<input name="stroke_unit" defaultValue="mm"/></label>
    <label>Peso<input name="weight" placeholder="Ex.: 185"/></label>
    <label>Unidade<input name="weight_unit" defaultValue="g"/></label>
    <label>Acessórios<input name="accessories" placeholder="Ex.: cartuchos, cabos"/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Salvar especificações</button>
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
