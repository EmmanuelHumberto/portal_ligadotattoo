import {EditorialListing} from '../../components/editorial-content';
import {pageMetadata} from '../../lib/seo';
export const metadata=pageMetadata({title:'Eventos',description:'Agenda de eventos e convenções de tatuagem.',path:'/eventos'});
export default function Events(){return <EditorialListing type="EVENT" eyebrow="AGENDA" title="Eventos" description="Convenções, encontros e atividades do ecossistema da tatuagem." basePath="/eventos"/>}
