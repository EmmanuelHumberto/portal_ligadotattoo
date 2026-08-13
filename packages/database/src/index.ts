export interface Transaction { readonly id: string }
export interface TransactionManager { run<T>(work:(tx:Transaction)=>Promise<T>):Promise<T> }
