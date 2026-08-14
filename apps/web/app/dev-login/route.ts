import { NextResponse } from 'next/server';

export function GET() {
  const token=process.env.DEV_ADMIN_TOKEN?.trim();
  if(!token){
    return NextResponse.json(
      {error:'DEV_ADMIN_TOKEN is not configured'},
      {status:500},
    );
  }
  const site=process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const res=NextResponse.redirect(new URL('/admin',site));
  res.cookies.set(process.env.ADMIN_SESSION_COOKIE ?? 'pt_session',token,{
    httpOnly:true,sameSite:'lax',path:'/',maxAge:8*60*60,
  });
  return res;
}
