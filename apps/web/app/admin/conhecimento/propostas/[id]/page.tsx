import Link from 'next/link';
import {AdminAccessState,AdminPageHeader} from '../../../../../components/admin-resource';
import {AdminActionForm} from '../../../../../components/admin-action-form';
import {adminApi} from '../../../../../lib/admin-api';
import {decideProposal} from '../../actions';

type Evidence={
 id:string;claimant_type:string;value:unknown;source_url?:string|null;
 confidence?:number|null;status?:string;observed_at?:string;
};
type Proposal={
 id:string;subject_type:string;subject_id:string;property_key:string;
 proposed_value:unknown;status:string;version:number;
 created_by?:string;decided_by?:string|null;decision_reason?:string|null;
 subject?:{id:string;name:string;slug:string;manufacturer:string}|null;
 evidence?:Evidence[];currentFact?:{value:unknown;decision_reason?:string|null}|null;
 conflict?:{status:string;created_at?:string}|null;
};

export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const result=await adminApi<Proposal>(`/admin/canonical-proposals/${id}`);
 if(!result.ok)return <>
  <AdminPageHeader eyebrow="Governança" title="Proposta canônica" description="Detalhe da proposta."/>
  <AdminAccessState status={result.status}/>
 </>;
 const p=result.data;
 const title=p.subject?.name ?? `${p.subject_type} · ${p.subject_id}`;
 return <>
  <AdminPageHeader eyebrow="Governança" title={p.property_key}
   description={`${p.subject_type} · ${p.status} · versão ${p.version}`}/>

  <div className="card panel">
   <h2>Produto</h2>
   {p.subject
    ? <dl className="adminFacts">
       <div><dt>Nome</dt>
        <dd><Link className="primary" href={`/maquinas/${p.subject.slug}`}>{p.subject.name}</Link></dd></div>
       <div><dt>Fabricante</dt><dd>{p.subject.manufacturer ?? '—'}</dd></div>
      </dl>
    : <p className="muted">Sujeito: {p.subject_type} / {p.subject_id}</p>}
  </div>

  <div className="card panel">
   <h2>Proposta</h2>
   <dl className="adminFacts">
    <div><dt>Propriedade</dt><dd>{p.property_key}</dd></div>
    <div><dt>Valor proposto</dt><dd>{JSON.stringify(p.proposed_value)}</dd></div>
    <div><dt>Criado por</dt><dd>{p.created_by??'—'}</dd></div>
    <div><dt>Decidido por</dt><dd>{p.decided_by??'—'}</dd></div>
    <div><dt>Motivo da decisão</dt><dd>{p.decision_reason??'—'}</dd></div>
   </dl>
  </div>

  {p.conflict&&<div className="card panel">
   <h2>Conflito</h2>
   <dl className="adminFacts">
    <div><dt>Status</dt><dd>{p.conflict.status}</dd></div>
    <div><dt>Aberto em</dt><dd>{p.conflict.created_at??'—'}</dd></div>
   </dl>
   <p className="muted">Há alegações divergentes para esta propriedade. Confira as evidências abaixo antes de decidir.</p>
  </div>}

  <div className="card panel">
   <h2>Evidências ({p.evidence?.length ?? 0})</h2>
   {(p.evidence??[]).length===0
    ? <p className="muted">Nenhuma evidência associada.</p>
    : <div className="adminTableWrap"><table className="adminTable">
       <thead><tr><th>Origem</th><th>Valor</th><th>Confiança</th><th>Fonte</th></tr></thead>
       <tbody>{p.evidence!.map(e=><tr key={e.id}>
        <td>{e.claimant_type}</td>
        <td>{JSON.stringify(e.value)}</td>
        <td>{e.confidence!=null?e.confidence:'—'}</td>
        <td>{e.source_url
          ? <a className="primary" href={e.source_url} rel="noreferrer" target="_blank">{e.source_url}</a>
          : '—'}</td>
       </tr>)}</tbody>
      </table></div>}
  </div>

  {p.currentFact&&<div className="card panel">
   <h2>Fato canônico atual</h2>
   <dl className="adminFacts">
    <div><dt>Valor vigente</dt><dd>{JSON.stringify(p.currentFact.value)}</dd></div>
    <div><dt>Origem</dt><dd>{p.currentFact.decision_reason??'—'}</dd></div>
   </dl>
   <p className="muted">Aprovar substitui o valor vigente acima.</p>
  </div>}

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
