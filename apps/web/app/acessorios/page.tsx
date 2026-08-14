import {CatalogPage} from '../../components/catalog-page';

export default function Acessorios({searchParams}:{searchParams:Promise<any>}){
 return <CatalogPage searchParams={searchParams} defaultType="ACCESSORY" path="/acessorios"
  title="Acessórios e suprimentos"
  description="Cabos, adaptadores RCA, grips, misturadores de tinta, decalque, batoque, luvas e suprimentos."/>;
}
