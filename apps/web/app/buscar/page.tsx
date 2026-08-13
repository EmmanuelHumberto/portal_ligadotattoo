import Link from 'next/link';
import {SiteHeader} from '../../components/site-header';
import {api} from '../../lib/api';
import {pageMetadata} from '../../lib/seo';

export const metadata=pageMetadata({title:'Busca',description:'Busque máquinas, marcas e conteúdo técnico.',path:'/buscar',noindex:true});

export default async function Search({searchParams}:{searchParams:Promise<{q?:string|string[]}>}){
 const raw=(await searchParams).q;
 const q=(Array.isArray(raw)?raw[0]??'':raw??'').trim().slice(0,120);
 const data=q?await api(`/public/search?q=${encodeURIComponent(q)}`,{cache:'no-store'}):{items:[],meta:{}};
 return <><SiteHeader/><main className="shell discoveryPage">
  <header className="catalogHead"><div><p className="accent">DESCOBERTA</p>
   <h1>Busca no Portal Tattoo</h1></div></header>
  <form className="card searchForm" action="/buscar" role="search">
   <label htmlFor="portal-search">O que você procura?</label>
   <div><input id="portal-search" name="q" defaultValue={q}
    placeholder="Máquinas, marcas, técnicas..."/><button className="btn primary">Buscar</button></div>
  </form>
  {q&&<p className="muted">{data.items?.length??0} resultados para “{q}”</p>}
  <section className="grid searchResults">{(data.items??[]).map((item:any)=><article
   className="card searchResult" key={`${item.type}:${item.id}`}>
   <p className="accent">{item.type}</p><h2><Link href={item.url}>{item.title}</Link></h2>
   {item.subtitle&&<p className="muted">{item.subtitle}</p>}
   <Link className="btn secondary" href={item.url}>Abrir resultado</Link>
  </article>)}</section>
  {q&&!data.items?.length&&<div className="card emptyState">Nenhum resultado encontrado.</div>}
 </main></>;
}
