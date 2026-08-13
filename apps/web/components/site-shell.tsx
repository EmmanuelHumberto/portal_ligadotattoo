import Link from 'next/link';

export function SiteShell({children}:{children:React.ReactNode}){
 return <><header className="topbar"><div className="shell">
  <Link className="brand" href="/">PORTAL TATTOO</Link>
 </div></header>{children}</>;
}
