import Link from 'next/link';
import {SiteHeader} from '../components/site-header';

export default function Home(){
 return <><SiteHeader/>
  <main className="shell">
   <section className="hero">
    <p className="eyebrow">PORTAL TATTOO</p>
    <h1>Máquinas, tecnologia, conhecimento e cultura.</h1>
    <p className="lead">Uma base editorial e técnica orientada por dados,
    proveniência e descoberta.</p>
    <div className="actions">
     <Link className="primary" href="/maquinas">Explorar máquinas</Link>
     <Link className="secondary" href="/noticias">Ver conteúdo</Link>
    </div>
   </section>
   <section className="heroArt">
    <img src="/portal-hero.png" alt="Arte do Portal Tattoo" className="heroImage"/>
   </section>
  </main>
 </>;
}
