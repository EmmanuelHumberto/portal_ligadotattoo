import {NextRequest,NextResponse} from 'next/server';

export async function POST(req:NextRequest){
 if(!req.cookies.get('pt_csrf'))return new NextResponse(null,{status:403});
 const body=await req.text();
 if(body.length>8192)return new NextResponse(null,{status:413});
 const base=process.env.API_INTERNAL_URL??'http://api:3000';
 const r=await fetch(`${base}/analytics/events`,{
  method:'POST',headers:{'content-type':'application/json'},body,
 });
 return new NextResponse(null,{status:r.ok?204:400});
}
