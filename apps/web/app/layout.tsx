import './globals.css';
import {connection} from 'next/server';
import {CompareProvider} from '../components/compare-dock';
export default async function Layout({children}:{children:React.ReactNode}){
 await connection();
 return <html lang="pt-BR"><body><CompareProvider>{children}</CompareProvider></body></html>;
}
