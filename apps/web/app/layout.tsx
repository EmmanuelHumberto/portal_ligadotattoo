import './globals.css';
import {connection} from 'next/server';
import {CompareProvider} from '../components/compare-dock';
import {OfferCompareProvider} from '../components/offer-compare';
export default async function Layout({children}:{children:React.ReactNode}){
 await connection();
 return <html lang="pt-BR"><body><CompareProvider><OfferCompareProvider>{children}</OfferCompareProvider></CompareProvider></body></html>;
}
