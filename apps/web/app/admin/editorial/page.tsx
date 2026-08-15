import Link from 'next/link';
import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {AdminActionForm} from '../../../components/admin-action-form';
import {adminApi} from '../../../lib/admin-api';
import {createEditorialDraft} from './actions';

type Rows={items:Record<string,unknown>[]};

export default async function Page(){
 const result=await adminApi<Rows>('/admin/editorial');
 return <>
  <AdminPageHeader eyebrow="Conteúdo" title="Editorial" description="Acompanhe pautas, revisão, agendamento e publicação."/>
  <div className="adminActions" style={{marginBottom:18}}>
   <Link className="secondary" href="/admin/editorial/candidatos">Candidatos e fluxo automático</Link>
   <Link className="secondary" href="/admin/editorial/temas">Descoberta por tema</Link>
  </div>
  <AdminActionForm action={createEditorialDraft} className="card adminForm">
   <h2>Novo rascunho</h2>
   <div className="adminFields">
    <label>Tipo
     <select name="contentType" defaultValue="NEWS">
      <option value="NEWS">Notícia</option>
      <option value="BLOG">Blog</option>
      <option value="EVENT">Evento</option>
      <option value="TECHNICAL_ARTICLE">Artigo técnico</option>
      <option value="NOTICE">Aviso</option>
     </select>
    </label>
    <label>Título<input name="title" required placeholder="Título da pauta"/></label>
    <label>Slug<input name="slug" placeholder="gerado do título se vazio" pattern="[a-z0-9-]+"/></label>
    <label>Subtítulo<input name="subtitle" placeholder="Opcional"/></label>
    <label>Resumo<textarea name="summary" rows={2} placeholder="Opcional"/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Criar rascunho</button>
   </div>
  </AdminActionForm>
  <AdminCollection result={result}
   hrefFor={row=>`/admin/editorial/${String(row.id)}`}
   columns={[
    {key:'title',label:'Título'},
    {key:'content_type',label:'Tipo'},
    {key:'status',label:'Status'},
    {key:'origin',label:'Origem'},
    {key:'updated_at',label:'Atualizado'},
   ]}/>
 </>;
}
