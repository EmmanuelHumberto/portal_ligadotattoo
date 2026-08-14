import Link from 'next/link';
import {AdminAccessState,AdminPageHeader} from '../../../../components/admin-resource';
import {AdminActionForm} from '../../../../components/admin-action-form';
import {adminApi} from '../../../../lib/admin-api';
import {
  approveDraft,approveEditorial,publishEditorial,
  removeEditorial,scheduleEditorial,submitEditorial,unpublishEditorial,
} from '../actions';

type Detail={
 id:string;contentType:string;slug:string;title:string;
 status:string;version:number;
 subtitle?:string|null;summary?:string|null;
 origin?:string;createdBy?:string;
 body?:{version:number;blocks:Array<Record<string,unknown>>};
};

export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const result=await adminApi<Detail>(`/admin/editorial/${id}`);
 if(!result.ok)return <>
  <AdminPageHeader eyebrow="Conteúdo" title="Editorial" description="Detalhe da pauta."/>
  <AdminAccessState status={result.status}/>
 </>;
 const content=result.data;
 const mediaUrls=await loadMediaUrls(content.body);
 return <>
  <AdminPageHeader eyebrow="Conteúdo" title={content.title}
   description={`${content.contentType} · ${content.status} · versão ${content.version}`}/>
  <Workflow content={content}/>
  <div className="card panel">
   <h2>Conteúdo</h2>
   {content.subtitle&&<p className="muted">{content.subtitle}</p>}
   {content.summary&&<p className="muted">{content.summary}</p>}
   {renderBody(content.body, mediaUrls)}
  </div>
  <div className="card panel">
   <h2>Metadados</h2>
   <dl className="adminFacts">
    <div><dt>Slug</dt><dd>{content.slug}</dd></div>
    <div><dt>Origem</dt><dd>{content.origin??'—'}</dd></div>
    <div><dt>Criado por</dt><dd>{content.createdBy??'—'}</dd></div>
   </dl>
  </div>
  <div className="adminActions">
   <Link className="secondary" href="/admin/editorial">Voltar</Link>
  </div>
 </>;
}

function Workflow({content}:{content:Detail}){
 const id=content.id;
 const version=content.version;
 return <div className="card panel">
  <h2>Fluxo editorial</h2>
  <p className="muted">Status atual: <strong>{content.status}</strong></p>
  <div className="adminActions">
   {content.status==='DRAFT'&&<>
    <AdminActionForm action={approveDraft} className="adminActions">
     <input type="hidden" name="id" value={id}/>
     <input type="hidden" name="version" value={version}/>
     <input name="reason" placeholder="Motivo da aprovação (opcional)"/>
     <button className="primary" type="submit">Aprovar rascunho</button>
    </AdminActionForm>
    <AdminActionForm action={submitEditorial}>
     <input type="hidden" name="id" value={id}/>
     <input type="hidden" name="version" value={version}/>
     <button className="secondary" type="submit">Só enviar para revisão</button>
    </AdminActionForm>
   </>}
   {content.status==='IN_REVIEW'&&<AdminActionForm action={approveEditorial} className="adminActions">
    <input type="hidden" name="id" value={id}/>
    <input type="hidden" name="version" value={version}/>
    <input name="reason" required placeholder="Motivo da aprovação"/>
    <button className="primary" type="submit">Aprovar</button>
   </AdminActionForm>}
   {content.status==='APPROVED'&&<>
    <AdminActionForm action={publishEditorial}>
     <input type="hidden" name="id" value={id}/>
     <input type="hidden" name="version" value={version}/>
     <button className="primary" type="submit">Publicar agora</button>
    </AdminActionForm>
    <AdminActionForm action={scheduleEditorial} className="adminActions">
     <input type="hidden" name="id" value={id}/>
     <input type="hidden" name="version" value={version}/>
     <input type="datetime-local" name="publishAt" required aria-label="Data de publicação"/>
     <button className="secondary" type="submit">Agendar</button>
    </AdminActionForm>
   </>}
   {content.status==='SCHEDULED'&&<AdminActionForm action={publishEditorial}>
    <input type="hidden" name="id" value={id}/>
    <input type="hidden" name="version" value={version}/>
    <button className="primary" type="submit">Publicar</button>
   </AdminActionForm>}
   {content.status==='PUBLISHED'&&<>
    <AdminActionForm action={unpublishEditorial}>
     <input type="hidden" name="id" value={id}/>
     <input type="hidden" name="version" value={version}/>
     <button className="secondary" type="submit">Despublicar</button>
    </AdminActionForm>
    <AdminActionForm action={removeEditorial}>
     <input type="hidden" name="id" value={id}/>
     <input type="hidden" name="version" value={version}/>
     <button className="danger" type="submit">Remover publicação</button>
    </AdminActionForm>
   </>}
   {content.status!=='PUBLISHED'&&content.status!=='ARCHIVED'&&
    <AdminActionForm action={removeEditorial}>
     <input type="hidden" name="id" value={id}/>
     <input type="hidden" name="version" value={version}/>
     <button className="danger" type="submit">Remover</button>
    </AdminActionForm>}
   {!['DRAFT','IN_REVIEW','APPROVED','SCHEDULED','PUBLISHED'].includes(content.status)&&
    <p className="muted">Nenhuma ação disponível para o status {content.status}.</p>}
  </div>
 </div>;
}

function renderBody(body:Detail['body'],mediaUrls:Record<string,string>={}){
 const blocks=body?.blocks;
 if(!blocks?.length)return <p className="muted">Sem conteúdo.</p>;
 return <div className="editorialBody">
  {blocks.map((b,i)=>{
   switch(b.type){
    case 'image':return <img key={i} className="editorialImage"
      src={mediaUrls[String(b.mediaId)] ?? undefined}
      alt={String(b.caption ?? b.alt ?? 'Imagem')}/>;
    case 'heading':return <h3 key={i}>{String(b.text??'')}</h3>;
    case 'paragraph':return <p key={i}>{String(b.text??'')}</p>;
    case 'quote':return <blockquote key={i}>{String(b.text??'')}
     {b.attribution?<footer>— {String(b.attribution)}</footer>:null}</blockquote>;
    case 'callout':return <div key={i} className="callout">
     {b.title?<strong>{String(b.title)}: </strong>:null}{String(b.text??'')}</div>;
    case 'steps':{
     const items=Array.isArray(b.items)?b.items as Array<Record<string,unknown>>:[];
     return <ol key={i}>{items.map((s,j)=>
      <li key={j}><strong>{String(s.title??'')}</strong> {String(s.body??'')}</li>)}</ol>;
    }
    default:return <p key={i} className="muted">[bloco {String(b.type)}]</p>;
   }
  })}
 </div>;
}

async function loadMediaUrls(body:Detail['body']){
 const ids=[...(body?.blocks ?? [])]
  .filter(b=>b.type==='image' && b.mediaId)
  .map(b=>String(b.mediaId));
 const urls:Record<string,string>={};
 await Promise.all([...new Set(ids)].map(async id=>{
  const r=await adminApi<{url:string}>(`/admin/media/${id}/url`);
  if(r.ok)urls[id]=r.data.url;
 }));
 return urls;
}
