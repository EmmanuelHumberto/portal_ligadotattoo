import type {AdminApiStatus} from './admin-status';

export type ActionResult =
 | {ok:true}
 | {ok:false;status:AdminApiStatus};

export function actionErrorMessage(status:AdminApiStatus):string{
 switch(status){
  case 401:return 'Sessão expirada ou ausente. Entre novamente.';
  case 403:return 'Permissão insuficiente para esta ação.';
  case 409:return 'O registro foi alterado por outra pessoa. Recarregue e tente de novo.';
  case 422:return 'Dados inválidos. Revise os campos informados.';
  default:return 'Não foi possível concluir a ação. Verifique a API.';
 }
}
