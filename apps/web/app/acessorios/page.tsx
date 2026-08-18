import {CatalogPage} from '../../components/catalog-page';
import type {SearchParams} from '../../lib/public-api-contracts';

export default function Acessorios({searchParams}:{searchParams:Promise<SearchParams>}){
 return <CatalogPage searchParams={searchParams} defaultType="ACCESSORY" path="/acessorios" showType={false}
  title="Acessórios e suprimentos"
  description="Cabos, adaptadores RCA, grips, misturadores de tinta, decalque, batoque, luvas e suprimentos."/>;
}
