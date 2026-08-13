import {api} from '../../../lib/api';
import {pageMetadata} from '../../../lib/seo';

export async function productMetadata(slug:string){
 const p=await api(`/public/products/${slug}`,{cache:'no-store'});
 return pageMetadata({
  title:p.name,
  description:p.summary??`Especificações, dados e ofertas de ${p.name}.`,
  path:`/maquinas/${slug}`,
 });
}
