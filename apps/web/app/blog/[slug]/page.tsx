import type {Metadata} from 'next';
import {EditorialDetail} from '../../../components/editorial-content';
import {apiOrNull} from '../../../lib/api';
import {editorialMetadata} from '../../../lib/seo';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 const item=await apiOrNull(`/public/editorial/${encodeURIComponent(slug)}`);
 return editorialMetadata(item??{title:'Artigo',summary:'',slug},'BLOG');
}

export default async function BlogDetail({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <EditorialDetail slug={slug} type="BLOG" basePath="/blog"/>}
