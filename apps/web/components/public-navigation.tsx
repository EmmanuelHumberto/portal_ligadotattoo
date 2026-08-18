'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

const items=[
 ['Máquinas','/maquinas'],['Fontes','/fontes'],['Acessórios','/acessorios'],
 ['Cartuchos','/cartuchos'],['Tintas','/tintas'],['Marcas','/marcas'],
 ['Notícias','/noticias'],['Blog técnico','/blog'],['Eventos','/eventos'],
 ['Ofertas','/ofertas'],
] as const;

export function PublicNavigation(){
 const pathname=usePathname();
 return <nav className="shell headerNav" aria-label="Principal">
  <span className="navLabel">Explorar</span>
  {items.map(([label,href])=>{
   const active=pathname===href||pathname.startsWith(`${href}/`);
   return <Link key={href} href={href} aria-current={active?'page':undefined}>{label}</Link>;
  })}
 </nav>;
}
