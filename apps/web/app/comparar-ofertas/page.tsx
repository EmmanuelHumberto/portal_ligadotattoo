import {api} from '../../lib/api';
import {SiteHeader} from '../../components/site-header';
import type {OfferPage,SearchParams} from '../../lib/public-api-contracts';

export default async function CompareOffers({searchParams}:{searchParams:Promise<SearchParams>}){
 const raw=(await searchParams).ids;
 const ids=Array.isArray(raw)?raw[0]??'':raw??'';
 const clean=ids.split(',').filter(Boolean).slice(0,4);
 const data:Pick<OfferPage,'items'>=clean.length
  ? await api<Pick<OfferPage,'items'>>(`/public/offers/compare?ids=${clean.join(',')}`)
  : {items:[]};
 const items=data.items;
 const amounts=items.map(o=>Number(o.amountUsd ?? o.amount)).filter(Number.isFinite);
 const minAmount=amounts.length?Math.min(...amounts):null;
 return <><SiteHeader/><main className="shell comparePage">
  <p className="accent">COMPARADOR DE PREÇOS</p><h1>Compare ofertas lado a lado</h1>
  {!items.length?<div className="card emptyState">Adicione até quatro ofertas para comparar.</div>:
  <div className="compareTable" role="region" aria-label="Comparação de ofertas" tabIndex={0}>
   <table>
    <thead><tr><th>Oferta</th>{items.map(o=><th key={o.listingId}>{o.product.name}<small>{o.seller}</small></th>)}</tr></thead>
    <tbody>
     <tr><th>Preço</th>{items.map(o=>{const usd=Number(o.amountUsd ?? o.amount);const isMin=minAmount!=null&&usd===minAmount;return <td key={o.listingId} className={isMin?'bestPrice':''}><strong>{money(o.amount,o.currency)}</strong>{o.currency!=='USD'&&<small> · ≈ {money(usd,'USD')}</small>}{isMin&&<small> · menor preço</small>}</td>;})}</tr>
     <tr><th>Vendedor</th>{items.map(o=><td key={o.listingId}>{o.seller}</td>)}</tr>
     <tr><th>Fabricante</th>{items.map(o=><td key={o.listingId}>{o.product.manufacturer.name}</td>)}</tr>
     <tr><th>Tipo</th>{items.map(o=><td key={o.listingId}>{o.product.type}</td>)}</tr>
     <tr><th>Disponibilidade</th>{items.map(o=><td key={o.listingId}>{availability(o.availability)}</td>)}</tr>
     <tr><th>Atualizado</th>{items.map(o=><td key={o.listingId}>{date(o.observedAt)}</td>)}</tr>
     <tr><th></th>{items.map(o=><td key={o.listingId}><a className="btn primary" href={o.outboundUrl} rel="nofollow sponsored">Ir para a loja</a></td>)}</tr>
    </tbody>
   </table>
  </div>}
 </main></>;
}

function money(amount:number,currency:string){return new Intl.NumberFormat('pt-BR',{style:'currency',currency}).format(amount)}
function date(value:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value))}
function availability(value:string){return value==='IN_STOCK'?'Em estoque':value==='OUT_OF_STOCK'?'Sem estoque':'Consulte disponibilidade'}
