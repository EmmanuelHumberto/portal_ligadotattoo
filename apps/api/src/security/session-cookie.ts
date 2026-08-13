export const SESSION_COOKIE='pt_session';
export const CSRF_COOKIE='pt_csrf';

export function sessionCookieOptions(){
 return {
  httpOnly:true,secure:process.env.NODE_ENV==='production',
  sameSite:'lax' as const,path:'/',maxAge:8*60*60*1000,
 };
}
export function csrfCookieOptions(){
 return {
  httpOnly:false,secure:process.env.NODE_ENV==='production',
  sameSite:'lax' as const,path:'/',maxAge:8*60*60*1000,
 };
}
