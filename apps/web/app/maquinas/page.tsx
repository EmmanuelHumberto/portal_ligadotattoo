import {CatalogPage} from '../../components/catalog-page';
import type {SearchParams} from '../../lib/public-api-contracts';

export default function Machines({searchParams}:{searchParams:Promise<SearchParams>}){
 return <CatalogPage searchParams={searchParams} defaultType="PEN,ROTARY,COIL" path="/maquinas"
  title="Máquinas de tatuagem"
  description="Compare tecnologias, especificações e ofertas com dados rastreáveis."/>;
}
