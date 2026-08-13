export type SafeFetchPurpose='INGESTION'|'MEDIA_IMPORT'|'WEBHOOK_VERIFY';

export interface SafeUrlFetchPort {
 fetch(input:{
  url:string;purpose:SafeFetchPurpose;maxBytes:number;timeoutMs:number;
 }):Promise<{status:number;headers:Record<string,string>;body:Buffer}>;
}
export const SAFE_URL_FETCH=Symbol('SAFE_URL_FETCH');

/**
 * All application features that fetch user/source-controlled URLs must use this
 * port. Concrete implementation reuses AR-28 DNS/IP validation and redirect
 * revalidation. Direct `fetch(input.url)` is forbidden outside approved adapters.
 */
