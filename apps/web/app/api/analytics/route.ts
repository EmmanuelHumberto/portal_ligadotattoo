import {NextRequest,NextResponse} from 'next/server';
const allowed=new Set([
 'product_open','compare_add','compare_remove','favorite_toggle',
 'filter_apply','offer_open','editorial_open',
]);
export async function POST(req:NextRequest){
 const body=await req.json().catch(()=>null);
 if(!body||!allowed.has(body.name))return new NextResponse(null,{status:204});
 // Production adapter can forward this sanitized event to first-party analytics.
 // Raw search text, credentials and free-form PII are intentionally not accepted.
 return new NextResponse(null,{status:204});
}
