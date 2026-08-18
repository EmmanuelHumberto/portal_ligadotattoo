'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

const groups=[
 {label:'Visão geral',items:[
  ['Dashboard','/admin'],['Operações','/admin/operacoes'],
  ['Auditoria','/admin/auditoria'],
 ]},
 {label:'Conteúdo e catálogo',items:[
  ['Produtos','/admin/produtos'],['Editorial','/admin/editorial'],
  ['Conhecimento','/admin/conhecimento'],['Mídia','/admin/midia'],
 ]},
 {label:'Aquisição',items:[
  ['Ingestão','/admin/ingestao'],['Fontes','/admin/fontes'],
  ['Comércio','/admin/comercio'],
 ]},
 {label:'Inteligência',items:[
  ['IA Hub','/admin/ia'],['Laboratório','/admin/laboratorio'],
  ['Problemas técnicos','/admin/problemas-tecnicos'],
 ]},
] as const;

export function AdminNavigation(){
 const pathname=usePathname();
 return <nav className="adminNavigation" aria-label="Navegação administrativa">
  {groups.map(group=><div className="adminNavGroup" key={group.label}>
   <span>{group.label}</span>
   {group.items.map(([label,href])=>{
    const active=href==='/admin'?pathname===href:pathname.startsWith(href);
    return <Link key={href} href={href} aria-current={active?'page':undefined}>
     <i aria-hidden="true"/>{label}
    </Link>;
   })}
  </div>)}
 </nav>;
}
