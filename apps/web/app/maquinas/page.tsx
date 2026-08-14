import {CatalogPage} from '../../components/catalog-page';

export default function Machines({searchParams}:{searchParams:Promise<any>}){
 return <CatalogPage searchParams={searchParams} defaultType="PEN,ROTARY" path="/maquinas"
  title="Máquinas de tatuagem"
  description="Compare tecnologias, especificações e ofertas com dados rastreáveis."/>;
}
