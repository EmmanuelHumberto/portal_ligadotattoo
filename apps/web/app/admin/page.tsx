import {adminApi} from '../../lib/api';

export default async function Admin(){
 const d=await adminApi('/admin/operations/dashboard');
 return <main className="adminShell"><aside className="adminNav"><b>ADMIN PORTAL</b>
  {['Dashboard','Catálogo','Conhecimento','Editorial','Fontes & Ingestão','IA Hub','Comercial','Mídia','Operações','Auditoria'].map(x=><a key={x}>{x}</a>)}
 </aside><section className="adminMain"><h1>Visão Geral</h1>
  <div className="grid metrics"><Metric n="Jobs" v={sum(d.jobs)}/><Metric n="IA · 24h" v={sum(d.ai24h)}/><Metric n="Ingestões · 24h" v={sum(d.ingestion24h)}/><Metric n="Mídias" v={sum(d.mediaRights)}/></div>
  <div className="grid adminPanels"><div className="card panel"><h2>Operações</h2><pre>{JSON.stringify(d.jobs,null,2)}</pre></div>
  <div className="card panel"><h2>Health operacional</h2><pre>{JSON.stringify(d.outbox,null,2)}</pre></div></div>
 </section></main>
}
function Metric({n,v}:{n:string;v:number}){return <div className="card metric"><span>{n}</span><strong>{v.toLocaleString('pt-BR')}</strong></div>}
function sum(a:any[]=[]){return a.reduce((n,x)=>n+Number(x.count??0),0)}
