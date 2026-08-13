import './globals.css';
import {connection} from 'next/server';
export default async function Layout({children}:{children:React.ReactNode}){
 await connection();
 return <html lang="pt-BR"><body>{children}</body></html>;
}
