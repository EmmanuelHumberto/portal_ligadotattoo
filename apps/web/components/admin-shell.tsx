import Link from 'next/link';

const navigation=[
 ['Dashboard','/admin'],
 ['Editorial','/admin/editorial'],
 ['Conhecimento','/admin/conhecimento'],
 ['Ingestão','/admin/ingestao'],
 ['Mídia','/admin/midia'],
 ['Comércio','/admin/comercio'],
 ['IA Hub','/admin/ia'],
 ['Auditoria','/admin/auditoria'],
] as const;

export function AdminShell({children}:{children:React.ReactNode}){
 return <div className="adminShell">
  <aside className="adminNav">
   <Link className="adminBrand" href="/admin">ADMIN PORTAL<small>LIGA DO TATTOO</small></Link>
   <nav aria-label="Navegação administrativa">
    {navigation.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}
   </nav>
   <Link className="adminPublicLink" href="/">Ver portal público</Link>
  </aside>
  <section className="adminMain">{children}</section>
 </div>;
}
