import Link from 'next/link';
import {adminApi} from '../lib/admin-api';
import {AdminNavigation} from './admin-navigation';

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
   <Link className="adminBrand" href="/admin"><b>PT</b><span>Portal Tattoo
    <small>central administrativa</small></span></Link>
   <AdminNavigation/>
   <div className="adminSession">
    <span className="adminSessionLabel">Sessão ativa</span>
    {actorLabel
      ? <><span className="sessionActor">{actorLabel}</span>
         {logoutUrl&&<a className="secondary" href={logoutUrl}>Sair</a>}</>
      : <>{loginUrl&&<a className="primary" href={loginUrl}>Entrar com OIDC</a>}</>}
   </div>
   <Link className="adminPublicLink" href="/">← Voltar ao portal público</Link>
  </aside>
  <section className="adminMain">
   <div className="adminTopbar">
    <span>Workspace operacional</span>
    <strong>{actorLabel??'Acesso protegido'}</strong>
   </div>
   <main className="adminContent">{children}</main>
  </section>
 </div>;
}
