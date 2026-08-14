import {AdminCollection,AdminPageHeader} from '../../../components/admin-resource';
import {adminApi} from '../../../lib/admin-api';

type Rows={items:Record<string,unknown>[]};

export default async function Page(){
 const [jobs,outbox,dead]=await Promise.all([
  adminApi<Rows>('/admin/operations/jobs'),
  adminApi<Rows>('/admin/operations/outbox'),
  adminApi<Rows>('/admin/operations/dead-letters'),
 ]);
 return <>
  <AdminPageHeader eyebrow="Operação" title="Operações" description="Jobs, outbox e dead letters do Worker durável."/>

  <AdminPageHeader eyebrow="Operação" title="Jobs" description="Fila de processamento durável."/>
  <AdminCollection result={jobs} columns={[
   {key:'job_type',label:'Tipo'},
   {key:'status',label:'Status'},
   {key:'attempts',label:'Tentativas'},
   {key:'available_at',label:'Disponível'},
   {key:'created_at',label:'Criado'},
  ]}/>

  <AdminPageHeader eyebrow="Operação" title="Outbox" description="Eventos de domínio aguardando entrega."/>
  <AdminCollection result={outbox} columns={[
   {key:'event_type',label:'Evento'},
   {key:'aggregate_type',label:'Agregado'},
   {key:'status',label:'Status'},
   {key:'attempts',label:'Tentativas'},
   {key:'occurred_at',label:'Ocorrido'},
  ]}/>

  <AdminPageHeader eyebrow="Operação" title="Dead letters" description="Mensagens que excederam as tentativas de entrega."/>
  <AdminCollection result={dead} columns={[
   {key:'kind',label:'Tipo'},
   {key:'error_code',label:'Erro'},
   {key:'attempt_count',label:'Tentativas'},
   {key:'status',label:'Status'},
   {key:'last_failed_at',label:'Última falha'},
  ]}/>
 </>;
}
