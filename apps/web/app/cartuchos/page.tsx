import {CatalogPage} from '../../components/catalog-page';
import type {SearchParams} from '../../lib/public-api-contracts';

export default function Cartuchos({searchParams}:{searchParams:Promise<SearchParams>}){
 return <CatalogPage searchParams={searchParams} defaultType="CARTRIDGE" path="/cartuchos" showType={false}
  title="Cartuchos"
  description="Cartuchos de agulha para máquinas de tatuagem."/>;
}
