import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {AdminActionForm} from '../../../components/admin-action-form';
import {adminApi} from '../../../lib/admin-api';
import {runNewsIngestion} from './actions';
type Rows={items:Record<string,unknown>[]};
export default async function Page(){
 const result=await adminApi<Rows>('/admin/ingestion/runs');
 return <><AdminPageHeader eyebrow="Aquisição segura" title="Ingestão" description="Monitore execuções das fontes e os resultados de cada coleta."/>
  <AdminActionForm action={runNewsIngestion} className="card adminForm">
   <h2>Forçar coleta</h2>
   <p className="muted">Enfileira agora a coleta das fontes de notícias (kind=NEWS).</p>
   <div className="adminActions">
    <button className="primary" type="submit">Coletar notícias agora</button>
   </div>
  </AdminActionForm>
  <AdminCollection result={result} columns={[{key:'source_name',label:'Fonte'},{key:'status',label:'Status'},{key:'deduplicated',label:'Duplicado'},{key:'error_code',label:'Erro'},{key:'started_at',label:'Início'},{key:'finished_at',label:'Fim'}]}/></>;
}
