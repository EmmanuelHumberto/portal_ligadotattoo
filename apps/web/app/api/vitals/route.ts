import {NextRequest,NextResponse} from 'next/server';
const allowed=new Set(['CLS','FCP','INP','LCP','TTFB']);
export async function POST(req:NextRequest){
 const x=await req.json().catch(()=>null);
 if(!x||!allowed.has(x.name)||!Number.isFinite(Number(x.value)))
  return new NextResponse(null,{status:204});
 // First-party metrics adapter can persist/aggregate this bounded payload.
 return new NextResponse(null,{status:204});
}
