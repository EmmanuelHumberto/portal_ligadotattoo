import Link from 'next/link';
import {notFound} from 'next/navigation';
import {connection} from 'next/server';
import {api,apiOrNull} from '../lib/api';
import {articleJsonLd,eventJsonLd} from '../lib/structured-data';
import {JsonLd} from './json-ld';
import {SiteHeader} from './site-header';

export async function EditorialListing(props:{
 type:'NEWS'|'BLOG'|'EVENT';eyebrow:string;title:string;description:string;
 basePath:string;
}){
 await connection();
 const data=await api(`/public/editorial?type=${props.type}`);
 return <><SiteHeader/><main className="shell discoveryPage">
  <header className="catalogHead"><div><p className="accent">{props.eyebrow}</p>
   <h1>{props.title}</h1><p className="muted">{props.description}</p></div>
   <span className="muted">{data.items?.length??0} publicações</span>
  </header>
  <section className="grid editorialListing">
   {(data.items??[]).map((item:any)=><article className="card editorialItem"
    key={item.id}><p className="accent">{label(item.contentType)}</p>
    <h2><Link href={`${props.basePath}/${item.slug}`}>{item.title}</Link></h2>
    <p className="muted">{item.summary}</p>
    {item.event?.startsAt&&<time dateTime={item.event.startsAt}>
     {formatDate(item.event.startsAt)} · {item.event.city}</time>}
    <Link className="btn secondary" href={`${props.basePath}/${item.slug}`}>
     Ler conteúdo</Link>
   </article>)}
  </section>
  {!data.items?.length&&<div className="card emptyState">Nenhuma publicação disponível.</div>}
 </main></>;
}

export async function EditorialDetail(props:{
 slug:string;type:'NEWS'|'BLOG'|'EVENT';basePath:string;
}){
 const item=await apiOrNull(`/public/editorial/${encodeURIComponent(props.slug)}`);
 if(!item||item.contentType!==props.type)notFound();
 return <><SiteHeader/><main className="shell editorialPage">
  <Link className="muted" href={props.basePath}>← Voltar</Link>
  <article className="card editorialDetail">
   <p className="accent">{label(item.contentType)}</p><h1>{item.title}</h1>
   {item.subtitle&&<p className="lead">{item.subtitle}</p>}
   <p className="muted">Publicado em {formatDate(item.publishedAt)}</p>
   {item.event&&<EventSummary event={item.event}/>}<EditorialBody body={item.body}/>
  </article>
  <JsonLd data={item.contentType==='EVENT'?eventJsonLd({
   ...item,startsAt:item.event?.startsAt,endsAt:item.event?.endsAt,
   location:item.event?{name:item.event.venueName,
    address:[item.event.city,item.event.countryCode].filter(Boolean).join(', ')}:null,
  }):articleJsonLd(item)}/>
 </main></>;
}

function EditorialBody({body}:{body:any}){
 return <div className="editorialBody">{(body?.blocks??[]).map((block:any,index:number)=>{
  if(block.type==='heading')return block.level===3?<h3 key={index}>{block.text}</h3>:<h2 key={index}>{block.text}</h2>;
  if(block.type==='quote')return <blockquote key={index}>{block.text}</blockquote>;
  if(block.type==='callout')return <aside className="callout" key={index}>
   {block.title&&<strong>{block.title}</strong>}<p>{block.text}</p></aside>;
  if(block.type==='steps')return <ol key={index}>{block.items?.map((x:any)=><li key={x.title}><b>{x.title}</b><p>{x.body}</p></li>)}</ol>;
  return block.type==='paragraph'?<p key={index}>{block.text}</p>:null;
 })}</div>;
}

function EventSummary({event}:{event:any}){
 return <dl className="eventSummary"><div><dt>Quando</dt><dd>{formatDate(event.startsAt)}</dd></div>
  <div><dt>Local</dt><dd>{[event.venueName,event.city,event.countryCode].filter(Boolean).join(' · ')}</dd></div>
  <div><dt>Status</dt><dd>{event.status}</dd></div></dl>;
}
function formatDate(value:string){return new Intl.DateTimeFormat('pt-BR',{
 dateStyle:'long',timeZone:'America/Sao_Paulo',
}).format(new Date(value))}
function label(type:string){return type==='NEWS'?'NOTÍCIA':type==='EVENT'?'EVENTO':'BLOG TÉCNICO'}
