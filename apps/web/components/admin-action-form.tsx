'use client';

import { useActionState } from 'react';
import type { ActionResult } from '../lib/admin-action';
import { actionErrorMessage } from '../lib/admin-action';

export function AdminActionForm({action,className,children}:{
 action:(prev:ActionResult,formData:FormData)=>Promise<ActionResult>;
 className?:string;
 children:React.ReactNode;
}){
 const [state,formAction]=useActionState(action,{ok:true} as ActionResult);
 return <form action={formAction} className={className}>
  {children}
  {!state.ok && <p className="formError" role="alert">{actionErrorMessage(state.status)}</p>}
 </form>;
}
