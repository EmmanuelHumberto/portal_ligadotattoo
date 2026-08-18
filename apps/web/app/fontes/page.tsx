import {CatalogPage} from '../../components/catalog-page';
import type {SearchParams} from '../../lib/public-api-contracts';

export default function Fontes({searchParams}:{searchParams:Promise<SearchParams>}){
 return <CatalogPage searchParams={searchParams} defaultType="POWER_SUPPLY,BATTERY" path="/fontes" showType={false}
  title="Fontes e baterias"
  description="Fontes de bancada e baterias wireless para máquinas de tatuagem."/>;
}
