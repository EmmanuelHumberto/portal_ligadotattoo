import {CatalogPage} from '../../components/catalog-page';

export default function Tintas({searchParams}:{searchParams:Promise<any>}){
 return <CatalogPage searchParams={searchParams} defaultType="INK" path="/tintas" showType={false}
  title="Tintas de tatuagem"
  description="Tintas, pigmentos, conjuntos de cores e grey wash de marcas para tatuagem."/>;
}
