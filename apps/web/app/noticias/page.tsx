import {EditorialListing} from '../../components/editorial-content';
import {pageMetadata} from '../../lib/seo';
export const metadata=pageMetadata({title:'Notícias',description:'Notícias sobre tecnologia e mercado da tatuagem.',path:'/noticias'});
export default function News(){return <EditorialListing type="NEWS" eyebrow="ATUALIDADE" title="Notícias" description="Tecnologia, indústria e cultura com contexto e proveniência." basePath="/noticias"/>}
