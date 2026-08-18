import Link from 'next/link';
import {SiteHeader} from '../../components/site-header';
import {OfferCompareButton} from '../../components/offer-compare';
import {api} from '../../lib/api';
import {pageMetadata} from '../../lib/seo';
import type {OfferPage} from '../../lib/public-api-contracts';

export const metadata=pageMetadata({
 title:'Ofertas',description:'Ofertas recentes de máquinas de tatuagem.',path:'/ofertas',
});

export default async function Offers({searchParams}:{
 searchParams:Promise<{cursor?:string|string[]}>
}){
 const raw=(await searchParams).cursor;
 const cursor=Array.isArray(raw)?raw[0]:raw;
 const query=new URLSearchParams({limit:'24'});
 if(cursor)query.set('cursor',cursor);
 const data=await api<OfferPage>(`/public/offers?${query}`,{cache:'no-store'});
 return <><SiteHeader/><main className="shell discoveryPage">
  <header className="catalogHead"><div><p className="accent">COMÉRCIO RESPONSÁVEL</p>
   <h1>Ofertas recentes</h1><p className="muted">Preços observados dentro da janela de atualização de cada loja.</p></div>
  </header>
  <aside className="card offerNotice"><strong>Antes de comprar</strong>
   <span> Confirme preço, estoque, garantia e condições diretamente com o vendedor.</span></aside>
  <section className="grid offerGrid">{data.items.map(offer=><article
   className="card offerCard" key={offer.listingId}>
   <p className="accent">{offer.product.manufacturer.name}</p>
   <h2><Link href={`/maquinas/${offer.product.slug}`}>{offer.product.name}</Link></h2>
   <p className="muted">{offer.seller} · {availability(offer.availability)}</p>
   <strong className="offerPrice">{money(offer.amount,offer.currency)}</strong>
   <small className="muted">Atualizado em {date(offer.observedAt)}</small>
   <div className="offerActions"><Link className="btn secondary"
    href={`/maquinas/${offer.product.slug}`}>Detalhes</Link>
    <OfferCompareButton item={{listingId:offer.listingId,label:`${offer.product.name} · ${offer.seller}`,seller:offer.seller}}/>
    <a className="btn primary" href={offer.outboundUrl} rel="nofollow sponsored">
     Ir para a loja</a></div>
  </article>)}</section>
  {!data.items?.length&&<div className="card emptyState">Nenhuma oferta recente disponível.</div>}
  {data.meta?.nextCursor&&<div className="pager"><Link className="btn secondary"
   href={`/ofertas?cursor=${encodeURIComponent(data.meta.nextCursor)}`}>Próxima página</Link></div>}
 </main></>;
}

function money(amount:number,currency:string){return new Intl.NumberFormat('pt-BR',{
 style:'currency',currency,
}).format(amount)}
function date(value:string){return new Intl.DateTimeFormat('pt-BR',{
 dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo',
}).format(new Date(value))}
function availability(value:string){return value==='IN_STOCK'?'Em estoque':
 value==='OUT_OF_STOCK'?'Sem estoque':'Consulte disponibilidade'}
