import Link from 'next/link';
import {GlobalSearch} from './global-search';
import {PublicNavigation} from './public-navigation';

export function SiteHeader(){
 return <header className="header">
  <div className="shell headerPrimary">
   <Link className="brand" href="/">
    <span className="brandMarkWord">PT</span>
    <span>Portal Tattoo<small>equipamento · técnica · cultura</small></span>
   </Link>
   <GlobalSearch/>
   <Link className="headerAdmin" href="/admin">Área administrativa</Link>
  </div>
  <div className="headerNavFrame">
   <PublicNavigation/>
  </div>
 </header>
}
