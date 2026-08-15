import {AdminPageHeader} from '../../../../components/admin-resource';
import {AdminActionForm} from '../../../../components/admin-action-form';
import {createPost} from '../actions';

export default function Page(){
 return <>
  <AdminPageHeader eyebrow="Conteúdo" title="Escrever post"
   description="Escreva um novo post para o blog. Separe parágrafos com uma linha em branco."/>
  <AdminActionForm action={createPost} className="card panel">
   <div className="adminFields">
    <label>Título<input name="title" required placeholder="Título do post"/></label>
    <label>Subtítulo<input name="subtitle" placeholder="Opcional"/></label>
    <label>Resumo<textarea name="summary" rows={2} placeholder="Resumo curto (aparece na listagem)"/></label>
    <label>Texto<textarea name="text" rows={18} placeholder="Escreva o conteúdo do post aqui."/></label>
   </div>
   <div className="adminActions">
    <button className="primary" type="submit">Salvar rascunho</button>
   </div>
  </AdminActionForm>
 </>;
}
