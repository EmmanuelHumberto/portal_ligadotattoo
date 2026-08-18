import type {Metadata} from 'next';
import {api} from '../../../lib/api';
import {MediaGallery} from '../../../components/media-gallery';
import {SiteHeader} from '../../../components/site-header';
import {JsonLd} from '../../../components/json-ld';
import {productJsonLd} from '../../../lib/structured-data';
import {pageMetadata} from '../../../lib/seo';
import {CompareButton} from '../../../components/compare-dock';
import type {
 ProductDetail,ProductOffers,
} from '../../../lib/public-api-contracts';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 const p=await api<ProductDetail>(`/public/products/${slug}`,{cache:'no-store'})
  .catch(()=>null);
 if(!p)return pageMetadata({title:'Máquina',description:'Máquina de tatuagem.',path:`/maquinas/${slug}`});
 return pageMetadata({
  title:p.name,
  description:p.summary??p.description??'Máquina de tatuagem.',
  path:`/maquinas/${p.slug}`,
  image:p.heroMedia?.url,
 });
}

export default async function Product({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const [p,offers]=await Promise.all([
  api<ProductDetail>(`/public/products/${slug}`,{cache:'no-store'}),
  api<ProductOffers>(`/public/products/${slug}/offers-v2`),
 ]);
 return <><SiteHeader/><main className="shell productPage">
  <div className="breadcrumbs">Início › Máquinas › {p.brand?.name} › {p.name}</div>
  <section className="productHero">
   <MediaGallery items={p.media??[]}/>
   <div className="summary"><span className="badge">{p.isSyntheticFixture?'DADOS SINTÉTICOS':'DADOS VERIFICADOS'}</span><h1>{p.name}</h1>
    <p className="muted">{p.brand?.name} · {p.machineTypeLabel??p.machineType}</p><p>{p.summary}</p>
    <dl>{p.specifications.slice(0,7).map(s=><div key={s.key}><dt>{s.label}</dt><dd>{display(s.value)}</dd></div>)}</dl>
    <div className="actions">
     <CompareButton item={{id:p.id,slug:p.slug,name:p.name,image:p.heroMedia?.url}}/>
     <a className="btn" href="#ofertas">Ver ofertas</a>
    </div>
   </div>
  </section>
  <section className="card provenance">{p.isSyntheticFixture?<><b>Fixture de desenvolvimento</b><span> Estes dados são sintéticos e não representam um produto real.</span></>:<><b>Dados com proveniência registrada</b><span> Consulte evidências e histórico de decisões.</span></>}</section>
  <section className="detailGrid"><article className="card content"><h2>Visão geral</h2><p>{p.description}</p>
   {(p.documents??[]).length>0&&<div style={{marginTop:20}}>
    <h3>Manuais e documentos</h3>
    <ul style={{listStyle:'none',padding:0,margin:0}}>
     {p.documents.map(d=><li key={d.id} style={{margin:'6px 0'}}>
      <a className="btn secondary" href={d.url} target="_blank" rel="noreferrer">⬇ {d.title}</a>{' '}
      <small className="muted">{Math.max(1,Math.round((d.byteSize??0)/1024))} KB</small>
     </li>)}
    </ul>
   </div>}
   </article>
   <aside id="ofertas" className="card offers"><h2>Ofertas</h2>
    {offers.items.map(o=><a key={o.listingId} href={o.outboundUrl} rel="nofollow sponsored">
     <b>{o.seller}</b><span>{o.amount!=null?`${o.currency} ${o.amount}`:'Site do fabricante'}</span>
     <small className="muted">{o.storeDomain??'loja'}</small>
     <em className="offerGo">Ir para o site</em>
    </a>)}
    {!offers.items?.length&&<p className="muted">Nenhuma oferta recente disponível.</p>}
   </aside>
  </section>
  <JsonLd data={productJsonLd(p,offers.items??[])}/>
 </main></>;
}

function display(value:unknown):string{
 return typeof value==='string'?value:JSON.stringify(value);
}
