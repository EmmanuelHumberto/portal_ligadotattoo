import {PortalImage} from './portal-image';
import {CompareButton} from './compare-dock';
import type {ProductSummary} from '../lib/public-api-contracts';

export function ProductCard({p}:{p:ProductSummary}){
 const image=p.heroMedia?.url??p.image;
 return <article className="card productCard">
  <div className="media">{image?<PortalImage src={image} alt=""
    width={480} height={420} unoptimized/>:<div className="productMediaFallback">
     <span aria-hidden="true">PT</span><small>Imagem em revisão</small>
    </div>}</div>
  <div className="body">
   <div className="productMeta"><span>{p.brand.name}</span><span>{p.typeLabel}</span></div>
   {p.badge&&<span className="badge">{p.badge}</span>}
   <h3>{p.name}</h3>
   <div className="price">{p.offerFrom?<>A partir de <strong>{p.offerFrom.currency} {p.offerFrom.amount}</strong></>:<span className="muted">Preço sob consulta</span>}</div>
   <div className="cardActions">
    <CompareButton item={{id:p.id,slug:p.slug,name:p.name,image}}/>
    <a className="btn secondary" href={`/maquinas/${p.slug}`}>Ver detalhes</a>
   </div>
  </div>
 </article>
}
