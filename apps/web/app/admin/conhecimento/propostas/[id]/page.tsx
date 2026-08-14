import Link from 'next/link';
import {AdminAccessState,AdminPageHeader} from '../../../../../components/admin-resource';
import {AdminActionForm} from '../../../../../components/admin-action-form';
import {adminApi} from '../../../../../lib/admin-api';
import {decideProposal} from '../../actions';

type Proposal={
 id:string;subject_type:string;subject_id:string;property_key:string;
 proposed_value:unknown;status:string;version:number;
 created_by?:string;decided_by?:string|null;decision_reason?:string|null;
 evidence?:unknown[];currentFact?:unknown|null;
};

export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const result=await adminApi<Proposal>(`/admin/canonical-proposals/${id}`);
 if(!result.ok)return <>
  <AdminPageHeader eyebrow="Governança" title="Proposta canônica" description="Detalhe da proposta."/>
  <AdminAccessState status={result.status}/>
 </>;
 const p=result.data;
 return <>
  <AdminPageHeader eyebrow="Governança" title={p.property_key}
   description={`${p.subject_type} · ${p.status} · versão ${p.version}`}/>
  <div className="card panel">
   <h2>Proposta</h2>
   <dl className="adminFacts">
    <div><dt>Sujeito</dt><dd>{p.subject_type} / {p.subject_id}</dd></div>
    <div><dt>Propriedade</dt><dd>{p.property_key}</dd></div>
    <div><dt>Valor proposto</dt><dd>{JSON.stringify(p.proposed_value)}</dd></div>
    <div><dt>Criado por</dt><dd>{p.created_by??'—'}</dd></div>
    <div><dt>Decidido por</dt><dd>{p.decided_by??'—'}</dd></div>
    <div><dt>Motivo da decisão</dt><dd>{p.decision_reason??'—'}</dd></div>
   </dl>
  </div>
  {p.status==='PENDING'&&<div className="card panel">
   <h2>Decisão</h2>
   <div className="adminActions">
    <AdminActionForm action={decideProposal} className="adminActions">
     <input type="hidden" name="proposalId" value={p.id}/>
     <input type="hidden" name="expectedVersion" value={p.version}/>
     <input type="hidden" name="decision" value="APPROVE"/>
     <input name="reason" required minLength={3} placeholder="Motivo da aprovação"/>
     <button className="primary" type="submit">Aprovar</button>
    </AdminActionForm>
    <AdminActionForm action={decideProposal} className="adminActions">
     <input type="hidden" name="proposalId" value={p.id}/>
     <input type="hidden" name="expectedVersion" value={p.version}/>
     <input type="hidden" name="decision" value="REJECT"/>
     <input name="reason" required minLength={3} placeholder="Motivo da rejeição"/>
     <button className="secondary" type="submit">Rejeitar</button>
    </AdminActionForm>
   </div>
  </div>}
  <div className="adminActions">
   <Link className="secondary" href="/admin/conhecimento">Voltar</Link>
  </div>
 </>;
}
