import {EditorialListing} from '../../components/editorial-content';
import {pageMetadata} from '../../lib/seo';
export const metadata=pageMetadata({title:'Blog técnico',description:'Guias e análises técnicas sobre equipamentos de tatuagem.',path:'/blog'});
export default function Blog(){return <EditorialListing type="BLOG" eyebrow="CONHECIMENTO" title="Blog técnico" description="Guias, análises e critérios para decisões mais informadas." basePath="/blog"/>}
