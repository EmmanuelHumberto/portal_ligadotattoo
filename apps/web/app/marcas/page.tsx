import Link from 'next/link';
import {connection} from 'next/server';
import {SiteHeader} from '../../components/site-header';
import {api} from '../../lib/api';
import {pageMetadata} from '../../lib/seo';

export const metadata=pageMetadata({title:'Marcas',description:'Fabricantes e marcas de máquinas de tatuagem.',path:'/marcas'});

export default async function Brands(){
 await connection();
 const data=await api('/public/manufacturers');
 return <><SiteHeader/><main className="shell discoveryPage">
  <header className="catalogHead"><div><p className="accent">FABRICANTES</p>
   <h1>Marcas e fabricantes</h1><p className="muted">Explore os fabricantes presentes no catálogo técnico.</p></div></header>
  <section className="grid brandGrid">{(data.items??[]).map((brand:any)=><article
   className="card brandCard" key={brand.id}><span className="accent">{brand.countryCode??'GLOBAL'}</span>
   <h2><Link href={`/marcas/${brand.slug}`}>{brand.name}</Link></h2>
   <p className="muted">{brand.productCount} produtos catalogados</p>
   <Link className="btn secondary" href={`/marcas/${brand.slug}`}>Ver máquinas</Link>
  </article>)}</section>
 </main></>;
}
