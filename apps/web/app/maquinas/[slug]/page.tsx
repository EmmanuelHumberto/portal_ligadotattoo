import {api} from '../../../lib/api';
import {SiteHeader} from '../../../components/site-header';

export default async function Product({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const [p,offers]=await Promise.all([
  api(`/public/products/${slug}`),api(`/public/products/${slug}/offers-v2`)
 ]);
 return <><SiteHeader/><main className="shell productPage">
  <div className="breadcrumbs">Início › Máquinas › {p.brand?.name} › {p.name}</div>
  <section className="productHero">
   <div className="card gallery">{p.media?.[0]&&<img src={p.media[0].url} alt={p.media[0].alt??p.name}/>}</div>
   <div className="summary"><span className="badge">DADOS VERIFICADOS</span><h1>{p.name}</h1>
    <p className="muted">{p.brand?.name} · {p.machineType}</p><p>{p.summary}</p>
    <dl>{(p.specifications??[]).slice(0,7).map((s:any)=><div key={s.key}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
    <a className="btn" href="#ofertas">Ver ofertas</a>
   </div>
  </section>
  <section className="card provenance"><b>Dados verificados por humanos</b><span> Consulte evidências e histórico de alterações.</span></section>
  <section className="detailGrid"><article className="card content"><h2>Visão geral</h2><p>{p.description}</p></article>
   <aside id="ofertas" className="card offers"><h2>Ofertas</h2>{offers.items?.map((o:any)=><a key={o.listingId} href={o.outboundUrl}><b>{o.seller}</b><span>{o.currency} {o.amount}</span></a>)}</aside>
  </section>
 </main></>
}
