import {NextRequest,NextResponse} from 'next/server';

export async function GET(req:NextRequest){
 const q=req.nextUrl.searchParams.get('q')?.trim()??'';
 if(q.length<2)return NextResponse.json({items:[]});
 const base=process.env.API_INTERNAL_URL??'http://api:3000';
 const r=await fetch(`${base}/public/search/suggest?q=${encodeURIComponent(q)}`,
   {next:{revalidate:30}});
 if(!r.ok)return NextResponse.json({items:[]},{status:200});
 const data=await r.json();
 return NextResponse.json({items:(data.items??[]).slice(0,8)});
}
