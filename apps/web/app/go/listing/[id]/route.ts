import {NextRequest,NextResponse} from 'next/server';

export async function GET(
  _req:NextRequest,
  {params}:{params:Promise<{id:string}>},
){
  const {id}=await params;
  const base=process.env.API_INTERNAL_URL??'http://api:3000';
  try {
    const r=await fetch(`${base}/go/listing/${encodeURIComponent(id)}`,{
      redirect:'manual',cache:'no-store',
    });
    const location=r.headers.get('location');
    if(!location)return new NextResponse(null,{status:404});
    const res=NextResponse.redirect(location,302);
    res.headers.set('Referrer-Policy','no-referrer');
    return res;
  } catch {
    return new NextResponse(null,{status:502});
  }
}
