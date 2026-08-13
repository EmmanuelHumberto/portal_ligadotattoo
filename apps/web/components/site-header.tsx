import Link from 'next/link';

export function SiteHeader(){
 const nav=['Máquinas','Marcas','Notícias','Blog Técnico','Eventos','Ofertas'];
 return <header className="header"><div className="shell headerIn">
  <Link className="brand" href="/">PORTAL TATTOO<small>CONHECIMENTO · TECNOLOGIA · ARTE</small></Link>
  <nav aria-label="Principal">{nav.map(x=><Link key={x} href={'/'+slug(x)}>{x}</Link>)}</nav>
  <form action="/buscar"><input name="q" aria-label="Buscar" placeholder="Buscar máquinas, marcas, técnicas..."/></form>
 </div></header>
}
function slug(x:string){return x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ /g,'-').replace('blog-tecnico','blog')}
