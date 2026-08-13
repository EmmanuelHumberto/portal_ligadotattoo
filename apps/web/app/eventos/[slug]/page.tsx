import {EditorialDetail} from '../../../components/editorial-content';
export default async function EventDetail({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <EditorialDetail slug={slug} type="EVENT" basePath="/eventos"/>}
