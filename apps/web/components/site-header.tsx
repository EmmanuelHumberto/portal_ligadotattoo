import Link from 'next/link';
import {GlobalSearch} from './global-search';

export function SiteHeader(){
 const nav:Array<[string,string]>=[
  ['Máquinas','/maquinas'],['Marcas','/marcas'],['Notícias','/noticias'],
  ['Blog Técnico','/blog'],['Eventos','/eventos'],['Ofertas','/ofertas'],
 ];
 return <header className="header"><div className="shell headerIn">
  <Link className="brand" href="/">PORTAL TATTOO<small>CONHECIMENTO · TECNOLOGIA · ARTE</small></Link>
  <nav aria-label="Principal">{nav.map(([label,href])=><Link key={href}
    href={href}>{label}</Link>)}</nav>
  <GlobalSearch/>
 </div></header>
}
