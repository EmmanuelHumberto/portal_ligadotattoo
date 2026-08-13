import {EditorialDetail} from '../../../components/editorial-content';
export default async function BlogDetail({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <EditorialDetail slug={slug} type="BLOG" basePath="/blog"/>}
