import {AdminAccessState,AdminPageHeader,Metric,sumCounts} from '../../components/admin-resource';
import {adminApi} from '../../lib/admin-api';

type Dashboard={
 jobs:unknown[];outbox:unknown[];deadLetters:unknown[];ai24h:unknown[];
 ingestion24h:unknown[];mediaRights:unknown[];workers:unknown[];
 scheduler?:{editorial_due?:number;crawl_targets_enabled?:number};generatedAt:string;
};

export default async function Admin(){
 const result=await adminApi<Dashboard>('/admin/operations/dashboard');
 if(!result.ok)return <AdminAccessState status={result.status}/>;
 const d=result.data;
 return <>
  <AdminPageHeader eyebrow="Operação em tempo real" title="Visão geral"
   description={`Projeção administrativa atualizada em ${new Date(d.generatedAt).toLocaleString('pt-BR')}.`}/>
  <div className="grid metrics">
   <Metric label="Jobs" value={sumCounts(d.jobs)}/>
   <Metric label="IA · 24h" value={sumCounts(d.ai24h)}/>
   <Metric label="Ingestões · 24h" value={sumCounts(d.ingestion24h)}/>
   <Metric label="Mídias" value={sumCounts(d.mediaRights)}/>
  </div>
  <div className="grid adminPanels">
   <Summary title="Fila de jobs" rows={d.jobs}/>
   <Summary title="Outbox" rows={d.outbox}/>
   <Summary title="Workers" rows={d.workers}/>
   <div className="card panel"><h2>Agenda</h2>
    <dl className="adminFacts"><div><dt>Editoriais pendentes</dt><dd>{d.scheduler?.editorial_due??0}</dd></div>
     <div><dt>Alvos de coleta</dt><dd>{d.scheduler?.crawl_targets_enabled??0}</dd></div></dl>
   </div>
  </div>
 </>;
}

function Summary({title,rows}:{title:string;rows:unknown[]}){
 return <div className="card panel"><h2>{title}</h2>
  {rows.length?<ul className="adminSummary">{rows.map((row,index)=><li key={index}>
   <span>{String((row as Record<string,unknown>).status??'TOTAL')}</span>
   <strong>{String((row as Record<string,unknown>).count??0)}</strong>
  </li>)}</ul>:<p className="muted">Sem ocorrências.</p>}
 </div>;
}
