import Link from 'next/link';
import type {AdminApiResult} from '../lib/admin-api';

type Row=Record<string,unknown>;
export type AdminColumn={key:string;label:string};

export function AdminAccessState({status}:{status:401|403|502}){
 const loginUrl=process.env.ADMIN_LOGIN_URL;
 if(status===401)return <div className="card adminState">
  <span className="statusPill">Sessão necessária</span>
  <h1>Acesso administrativo</h1>
  <p>A área está protegida por OIDC. Inicie uma sessão administrativa para consultar dados e operações internas.</p>
  <div className="actions">
   {loginUrl&&<a className="primary" href={loginUrl}>Entrar com OIDC</a>}
   <Link className="secondary" href="/">Voltar ao portal</Link>
  </div>
 </div>;
 if(status===403)return <div className="card adminState">
  <span className="statusPill warning">Acesso limitado</span>
  <h1>Permissão insuficiente</h1>
  <p>Sua sessão é válida, mas não possui a capacidade exigida por este módulo.</p>
  <Link className="secondary" href="/admin">Voltar ao dashboard</Link>
 </div>;
 return <div className="card adminState">
  <span className="statusPill danger">Indisponível</span>
  <h1>Não foi possível consultar a API</h1>
  <p>O acesso continua protegido. Verifique a saúde da API e tente novamente.</p>
 </div>;
}

export function AdminPageHeader({eyebrow,title,description}:{
 eyebrow:string;title:string;description:string;
}){
 return <header className="adminPageHeader">
  <p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p>
 </header>;
}

export function AdminCollection({result,columns,empty='Nenhum registro encontrado.'}:{
 result:AdminApiResult<{items:Row[]}>;columns:AdminColumn[];empty?:string;
}){
 if(!result.ok)return <AdminAccessState status={result.status}/>;
 if(!result.data.items.length)return <div className="card adminEmpty">{empty}</div>;
 return <div className="card adminTableWrap"><table className="adminTable">
  <thead><tr>{columns.map(column=><th key={column.key}>{column.label}</th>)}</tr></thead>
  <tbody>{result.data.items.map((row,index)=><tr key={String(row.id??index)}>
   {columns.map(column=><td key={column.key}>{formatValue(row[column.key])}</td>)}
  </tr>)}</tbody>
 </table></div>;
}

export function Metric({label,value}:{label:string;value:unknown}){
 return <div className="card metric"><span>{label}</span><strong>{formatValue(value)}</strong></div>;
}

export function sumCounts(value:unknown){
 if(!Array.isArray(value))return 0;
 return value.reduce((total,item)=>total+Number((item as Row)?.count??0),0);
}

function formatValue(value:unknown):string{
 if(value===null||value===undefined||value==='')return '—';
 if(typeof value==='boolean')return value?'Sim':'Não';
 if(typeof value==='object')return JSON.stringify(value);
 if(typeof value==='string'&&/^\d{4}-\d\d-\d\dT/.test(value)){
  const date=new Date(value);
  if(!Number.isNaN(date.valueOf()))return new Intl.DateTimeFormat('pt-BR',{
   dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo',
  }).format(date);
 }
 return String(value);
}
