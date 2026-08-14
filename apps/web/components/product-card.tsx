import {PortalImage} from './portal-image';

export function ProductCard({p}:{p:any}){
 return <article className="card productCard">
  <div className="media">{(p.heroMedia?.url||p.image)&&<PortalImage src={p.heroMedia?.url||p.image} alt=""
    width={480} height={420} unoptimized/>}</div>
  <div className="body">
   {p.badge&&<span className="badge">{p.badge}</span>}
   <h3>{p.name}</h3><p className="muted">{p.brand?.name??p.brand} · {p.typeLabel??p.type}</p>
   <div className="price">{p.offerFrom?<>A partir de <strong>{p.offerFrom.currency} {p.offerFrom.amount}</strong></>:<span className="muted">Consultar ofertas</span>}</div>
   <a className="btn secondary" href={`/maquinas/${p.slug}`}>Ver detalhes</a>
  </div>
 </article>
}
