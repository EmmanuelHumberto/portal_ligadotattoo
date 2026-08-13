export function ProductCard({p}:{p:any}){
 return <article className="card productCard">
  <div className="media">{p.image&&<img src={p.image} alt="" loading="lazy"/>}</div>
  <div className="body">
   {p.badge&&<span className="badge">{p.badge}</span>}
   <h3>{p.name}</h3><p className="muted">{p.brand?.name??p.brand} · {p.type}</p>
   <div className="price">{p.offerFrom?<>A partir de <strong>{p.offerFrom}</strong></>:<span className="muted">Consultar ofertas</span>}</div>
   <a className="btn secondary" href={`/maquinas/${p.slug}`}>Ver detalhes</a>
  </div>
 </article>
}
