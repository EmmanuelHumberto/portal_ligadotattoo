import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {AdminActionForm} from '../../../components/admin-action-form';
import {adminApi} from '../../../lib/admin-api';
import {createSource,createTarget} from './actions';

type Row=Record<string,unknown>;
type Rows={items:Row[]};

export default async function Page(){
 const [sources,targets]=await Promise.all([
  adminApi<Rows>('/admin/sources'),
  adminApi<Rows>('/admin/crawl-targets'),
 ]);
 return <>
  <AdminPageHeader eyebrow="Ingestão" title="Fontes" description="Fontes de aquisição e alvos de coleta do pipeline de ingestão."/>

  <AdminActionForm action={createSource} className="card adminForm">
   <h2>Nova fonte</h2>
   <div className="adminFields">
    <label>Nome<input name="name" required placeholder="Ex.: Fabricante Oficial"/></label>
    <label>Tipo
     <select name="kind" defaultValue="MANUFACTURER">
      <option value="MANUFACTURER">Fabricante</option>
      <option value="RETAILER">Varejista</option>
      <option value="NEWS">Notícias</option>
      <option value="EVENT">Eventos</option>
      <option value="TECHNICAL">Técnico</option>
      <option value="OTHER">Outro</option>
     </select>
    </label>
    <label>URL base (HTTPS)<input name="baseUrl" required type="url" placeholder="https://…"/></label>
    <label>Política de robots
     <select name="robotsPolicy" defaultValue="RESPECT">
      <option value="RESPECT">Respeitar</option>
      <option value="MANUAL_ALLOW">Permissão manual</option>
      <option value="DISABLED">Desativado</option>
     </select>
    </label>
    <label>Atraso de coleta (ms)<input name="crawlDelayMs" type="number" min="250" step="50" placeholder="1000"/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Criar fonte</button>
   </div>
  </AdminActionForm>

  <AdminActionForm action={createTarget} className="card adminForm">
   <h2>Novo alvo de coleta</h2>
   <div className="adminFields">
    <label>Fonte
     <select name="sourceId" required>
      {sources.ok && sources.data.items.map(s=>
       <option key={String(s.id)} value={String(s.id)}>{String(s.name)}</option>)}
     </select>
    </label>
    <label>URL do alvo<input name="url" required type="url" placeholder="https://site.com/pagina"/></label>
    <label>Modo de descoberta
     <select name="discoveryMode" defaultValue="EDITORIAL">
      <option value="EDITORIAL">Editorial (notícias)</option>
      <option value="CATALOG">Catálogo (produtos/ofertas)</option>
      <option value="MIXED">Misto</option>
      <option value="SNAPSHOT_ONLY">Apenas snapshot</option>
     </select>
    </label>
    <label>Frequência
     <select name="scheduleKey" defaultValue="1h">
      <option value="15m">15 minutos</option>
      <option value="1h">1 hora</option>
      <option value="6h">6 horas</option>
      <option value="24h">24 horas</option>
     </select>
    </label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Criar alvo</button>
   </div>
  </AdminActionForm>

  <AdminPageHeader compact eyebrow="Ingestão" title="Fontes" description=""/>
  <AdminCollection result={sources} columns={[
   {key:'name',label:'Nome'},
   {key:'kind',label:'Tipo'},
   {key:'base_url',label:'URL base'},
   {key:'status',label:'Status'},
   {key:'updated_at',label:'Atualizada'},
  ]}/>

  <AdminPageHeader compact eyebrow="Ingestão" title="Alvos de coleta" description=""/>
  <AdminCollection result={targets} columns={[
   {key:'url',label:'URL'},
   {key:'source_name',label:'Fonte'},
   {key:'discovery_mode',label:'Modo'},
   {key:'schedule_key',label:'Frequência'},
   {key:'status',label:'Status'},
   {key:'last_crawled_at',label:'Última coleta'},
  ]}/>
 </>;
}
