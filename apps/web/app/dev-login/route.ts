import { NextResponse } from 'next/server';

export function GET() {
  if(!['development','test'].includes(process.env.NODE_ENV ?? '')){
    return NextResponse.json({error:'Not found'},{status:404});
  }
  const token=process.env.DEV_ADMIN_TOKEN?.trim();
  if(!token){
    return NextResponse.json(
      {error:'DEV_ADMIN_TOKEN is not configured'},
      {status:500},
    );
  }
  const site=process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const siteUrl=new URL(site);
  const res=NextResponse.redirect(new URL('/admin',siteUrl));
  res.cookies.set(process.env.ADMIN_SESSION_COOKIE ?? 'pt_session',token,{
    httpOnly:true,sameSite:'lax',secure:siteUrl.protocol==='https:',
    path:'/',maxAge:8*60*60,
  });
  return res;
}
