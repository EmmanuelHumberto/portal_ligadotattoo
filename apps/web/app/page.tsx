import Image from 'next/image';
import Link from 'next/link';
import {SiteHeader} from '../components/site-header';

export default function Home(){
 return <><SiteHeader/>
  <main>
   <section className="shell homeHero homeHeroMinimal">
    <div className="homeHeroCopy">
     <p className="eyebrow">Portal Tattoo</p>
     <h1>Tecnologia, conhecimento e arte.</h1>
     <div className="actions">
      <Link className="primary" href="/maquinas">Explorar catálogo</Link>
      <Link className="secondary" href="/noticias">Ver conteúdo</Link>
     </div>
    </div>
    <div className="homeHeroVisual">
     <Image src="/portal-hero.png" alt="Estúdio de tatuagem e processo criativo"
      width={1536} height={1024} priority sizes="(max-width: 800px) 100vw, 48vw"/>
    </div>
   </section>
  </main>
 </>;
}
