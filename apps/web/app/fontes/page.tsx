import {CatalogPage} from '../../components/catalog-page';

export default function Fontes({searchParams}:{searchParams:Promise<any>}){
 return <CatalogPage searchParams={searchParams} defaultType="POWER_SUPPLY,BATTERY" path="/fontes"
  title="Fontes e baterias"
  description="Fontes de bancada e baterias wireless para máquinas de tatuagem."/>;
}
