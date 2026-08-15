import {AdminAccessState,AdminPageHeader} from '../../../../components/admin-resource';
import {AdminActionForm} from '../../../../components/admin-action-form';
import {adminApi} from '../../../../lib/admin-api';
import {createTopic,runTopicDiscovery,toggleTopic} from './actions';

type Topic={id:string;name:string;query:string;language:string;status:string;max_articles:number;last_discovered_at?:string|null};
type Rows={items:Topic[]};

export default async function Page(){
 const result=await adminApi<Rows>('/admin/editorial-topics');
 if(!result.ok)return <>
  <AdminPageHeader eyebrow="Conteúdo" title="Descoberta por tema" description="Descubra conteúdo do universo da tatuagem por assunto."/>
  <AdminAccessState status={result.status}/>
 </>;
 const items=result.data.items;
 return <>
  <AdminPageHeader eyebrow="Conteúdo" title="Descoberta por tema"
   description="Descubra conteúdo do universo da tatuagem por assunto (RSS do Google News) e gere candidatos para aprovação e publicação no blog."/>
  <AdminActionForm action={runTopicDiscovery} className="card adminForm">
   <h2>Descobrir agora</h2>
   <p className="muted">Percorre todos os temas ativos e enfileira artigos para coleta. Os candidatos aparecem em "Candidatos de história".</p>
   <div className="adminActions"><button className="primary" type="submit">Descobrir por tema</button></div>
  </AdminActionForm>
  <AdminActionForm action={createTopic} className="card adminForm">
   <h2>Novo tema</h2>
   <div className="adminFields">
    <label>Nome<input name="name" required placeholder="Ex.: Máquinas rotativas"/></label>
    <label>Termo de busca<input name="query" required placeholder="Ex.: tattoo machine rotary"/></label>
    <label>Idioma<input name="language" defaultValue="pt-BR"/></label>
    <label>Máx. artigos<input name="maxArticles" type="number" defaultValue={5} min={1} max={20}/></label>
   </div>
   <div className="adminActions"><button className="primary" type="submit">Criar tema</button></div>
  </AdminActionForm>
  <div className="card adminTableWrap"><table className="adminTable">
   <thead><tr><th>Tema</th><th>Termo</th><th>Idioma</th><th>Status</th><th>Última descoberta</th><th>Ação</th></tr></thead>
   <tbody>{items.map(t=><tr key={t.id}>
    <td>{t.name}</td><td>{t.query}</td><td>{t.language}</td>
    <td>{t.status}</td><td>{t.last_discovered_at??'—'}</td>
    <td><AdminActionForm action={toggleTopic} className="adminActions">
     <input type="hidden" name="id" value={t.id}/>
     <input type="hidden" name="status" value={t.status==='ACTIVE'?'PAUSED':'ACTIVE'}/>
     <button className="secondary" type="submit">{t.status==='ACTIVE'?'Pausar':'Ativar'}</button>
    </AdminActionForm></td>
   </tr>)}</tbody>
  </table></div>
 </>;
}
