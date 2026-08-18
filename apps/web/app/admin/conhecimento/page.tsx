import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {AdminActionForm} from '../../../components/admin-action-form';
import {adminApi} from '../../../lib/admin-api';
import {createProposal,recordClaim} from './actions';

type Rows={items:Record<string,unknown>[]};

export default async function Page(){
 const [claims,proposals]=await Promise.all([
  adminApi<Rows>('/admin/claims'),
  adminApi<Rows>('/admin/canonical-proposals'),
 ]);
 return <>
  <AdminPageHeader eyebrow="Governança de dados" title="Conhecimento" description="Registre alegações com evidência e proponha fatos canônicos para decisão."/>

  <AdminActionForm action={recordClaim} className="card adminForm">
   <h2>Registrar alegação</h2>
   <div className="adminFields">
    <label>Sujeito (tipo)<input name="subjectType" required placeholder="PRODUCT"/></label>
    <label>Sujeito (uuid)<input name="subjectId" required placeholder="00000000-0000-0000-0000-000000000000"/></label>
    <label>Propriedade<input name="propertyKey" required placeholder="stroke_mm"/></label>
    <label>Valor (JSON)<input name="value" required placeholder='3.5 | {"n":3.5} | "texto"'/></label>
    <label>Origem da alegação<input name="claimantType" required placeholder="SPEC"/></label>
    <label>Confiança (0–1)<input name="confidence" type="number" min="0" max="1" step="0.01" placeholder="0.9"/></label>
    <label>URL da fonte<input name="sourceUrl" type="url" placeholder="https://…"/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Registrar alegação</button>
   </div>
  </AdminActionForm>

  <AdminActionForm action={createProposal} className="card adminForm">
   <h2>Propor fato canônico</h2>
   <div className="adminFields">
    <label>Sujeito (tipo)<input name="subjectType" required placeholder="PRODUCT"/></label>
    <label>Sujeito (uuid)<input name="subjectId" required placeholder="00000000-0000-0000-0000-000000000000"/></label>
    <label>Propriedade<input name="propertyKey" required placeholder="stroke_mm"/></label>
    <label>Valor proposto (JSON)<input name="proposedValue" required placeholder='3.5'/></label>
    <label>Evidências (uuids)<textarea name="evidenceIds" required placeholder="uuid1, uuid2" rows={2}/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Propor canonização</button>
   </div>
  </AdminActionForm>

  <AdminPageHeader compact eyebrow="Governança" title="Propostas" description="Propostas pendentes de decisão canônica."/>
  <AdminCollection result={proposals}
   hrefFor={row=>`/admin/conhecimento/propostas/${String(row.id)}`}
   columns={[
    {key:'subject_name',label:'Produto'},
    {key:'property_key',label:'Propriedade'},
    {key:'status',label:'Status'},
    {key:'version',label:'Versão'},
    {key:'created_at',label:'Criada'},
   ]}/>

  <AdminPageHeader compact eyebrow="Governança" title="Alegações" description="Alegações registradas com origem, confiança e status."/>
  <AdminCollection result={claims} columns={[
   {key:'subject_type',label:'Sujeito'},
   {key:'property_key',label:'Propriedade'},
   {key:'value',label:'Valor'},
   {key:'confidence',label:'Confiança'},
   {key:'status',label:'Status'},
   {key:'observed_at',label:'Observado'},
  ]}/>
 </>;
}
