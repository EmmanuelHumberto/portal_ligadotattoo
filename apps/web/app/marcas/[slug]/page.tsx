import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ProductCard} from '../../../components/product-card';
import {SiteHeader} from '../../../components/site-header';
import {api,apiOrNull} from '../../../lib/api';
import type {
 Manufacturer,ProductPage,
} from '../../../lib/public-api-contracts';

export default async function Brand({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const manufacturer=await apiOrNull<Manufacturer>(
  `/public/manufacturers/${encodeURIComponent(slug)}`,
 );
 if(!manufacturer)notFound();
 const products=await api<ProductPage>(
  `/public/products?manufacturer=${encodeURIComponent(slug)}`,
 );
 return <><SiteHeader/><main className="shell discoveryPage">
  <div className="breadcrumbs"><Link href="/marcas">Marcas</Link> › {manufacturer.name}</div>
  <header className="catalogHead"><div><p className="accent">FABRICANTE · {manufacturer.countryCode??'GLOBAL'}</p>
   <h1>{manufacturer.name}</h1><p className="muted">{manufacturer.productCount} produtos catalogados</p></div>
   {manufacturer.officialWebsite&&<a className="btn secondary" href={manufacturer.officialWebsite}
    rel="noreferrer" target="_blank">Site oficial</a>}
  </header>
  <section className="grid catalogProducts">{products.items.map(p=><ProductCard key={p.id} p={p}/>)}</section>
 </main></>;
}
