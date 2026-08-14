import {CatalogPage} from '../../components/catalog-page';

export default function Cartuchos({searchParams}:{searchParams:Promise<any>}){
 return <CatalogPage searchParams={searchParams} defaultType="CARTRIDGE" path="/cartuchos" showType={false}
  title="Cartuchos"
  description="Cartuchos de agulha para máquinas de tatuagem."/>;
}
