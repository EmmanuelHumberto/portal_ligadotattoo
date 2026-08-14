import {AdminAccessState,AdminPageHeader} from '../../../../components/admin-resource';
import {AdminActionForm} from '../../../../components/admin-action-form';
import {adminApi} from '../../../../lib/admin-api';
import {generateAIDraft} from '../actions';
import {setAutoDraft} from './actions';

type Row={id:string;title?:string;status?:string;source_url?:string;created_at?:string};
type Rows={items:Row[]};
type AutoDraftState={enabled:boolean};

export default async function Page(){
 const [candidates,autoDraft]=await Promise.all([
  adminApi<Rows>('/admin/editorial/candidates'),
  adminApi<AutoDraftState>('/admin/editorial-config/auto-draft'),
 ]);
 if(!candidates.ok)return <>
  <AdminPageHeader eyebrow="Conteúdo" title="Candidatos" description="Material descoberto pela ingestão."/>
  <AdminAccessState status={candidates.status}/>
 </>;
 const items=candidates.data.items;
 const enabled=autoDraft.ok && autoDraft.data.enabled;
 return <>
  <AdminPageHeader eyebrow="Conteúdo" title="Candidatos de história"
   description="Material descoberto pela ingestão. Gere um rascunho com IA para revisão e aprovação humana."/>
  <AutoDraftToggle enabled={enabled}/>
  {items.length===0
   ? <div className="card adminEmpty">Nenhum candidato. A ingestão cria candidatos ao coletar fontes de notícias.</div>
   : <div className="card adminTableWrap"><table className="adminTable">
     <thead><tr><th>Título</th><th>Status</th><th>Fonte</th><th>Ação</th></tr></thead>
     <tbody>{items.map(c=><tr key={c.id}>
      <td>{c.title??'—'}</td>
      <td>{c.status}</td>
      <td>{c.source_url}</td>
      <td>{(c.status==='NEW'||c.status==='QUALIFIED')
        ? <AdminActionForm action={generateAIDraft} className="adminActions">
           <input type="hidden" name="candidateId" value={c.id}/>
           <button className="primary" type="submit">Gerar via IA</button>
          </AdminActionForm>
        : '—'}
      </td>
     </tr>)}</tbody>
    </table></div>}
 </>;
}

function AutoDraftToggle({enabled}:{enabled:boolean}){
 return <div className="card panel autoDraftToggle">
  <div>
   <h2>Fluxo automático de rascunho</h2>
   <p className="muted">Quando ativado, o Worker gera rascunhos via IA sozinho para os candidatos qualificados — sem botão.</p>
  </div>
  <div className="adminActions">
   <span className={`statusPill${enabled?'':' warning'}`}>{enabled?'Ativado':'Desativado'}</span>
   <AdminActionForm action={setAutoDraft}>
    <input type="hidden" name="enabled" value={enabled?'false':'true'}/>
    <button className={enabled?'secondary':'primary'} type="submit">
     {enabled?'Desativar':'Ativar'}
    </button>
   </AdminActionForm>
  </div>
 </div>;
}
