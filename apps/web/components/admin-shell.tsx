import Link from 'next/link';
import {adminApi} from '../lib/admin-api';

const navigation=[
 ['Dashboard','/admin'],
 ['Produtos','/admin/produtos'],
 ['Editorial','/admin/editorial'],
 ['Conhecimento','/admin/conhecimento'],
 ['Ingestão','/admin/ingestao'],
 ['Fontes','/admin/fontes'],
 ['Mídia','/admin/midia'],
 ['Comércio','/admin/comercio'],
 ['Problemas técnicos','/admin/problemas-tecnicos'],
 ['Laboratório','/admin/laboratorio'],
 ['IA Hub','/admin/ia'],
 ['Operações','/admin/operacoes'],
 ['Auditoria','/admin/auditoria'],
] as const;

type Me={actorId?:string;externalSubject?:string;capabilities?:string[]};

export async function AdminShell({children}:{children:React.ReactNode}){
 const me=await adminApi<Me>('/admin/me');
 const loginUrl=process.env.ADMIN_LOGIN_URL;
 const logoutUrl=process.env.ADMIN_LOGOUT_URL;
 const actorLabel=me.ok
  ? (me.data.actorId ?? me.data.externalSubject ?? 'Sessão administrativa')
  : null;
 return <div className="adminShell">
  <aside className="adminNav">
   <Link className="adminBrand" href="/admin">ADMIN PORTAL<small>LIGA DO TATTOO</small></Link>
   <nav aria-label="Navegação administrativa">
    {navigation.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}
   </nav>
   <div className="adminSession">
    {actorLabel
      ? <><span className="sessionActor">{actorLabel}</span>
         {logoutUrl&&<a className="secondary" href={logoutUrl}>Sair</a>}</>
      : <>{loginUrl&&<a className="primary" href={loginUrl}>Entrar com OIDC</a>}</>}
   </div>
   <Link className="adminPublicLink" href="/">Ver portal público</Link>
  </aside>
  <section className="adminMain">{children}</section>
 </div>;
}
