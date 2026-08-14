'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate} from '../../../lib/admin-api';
import type {ActionResult} from '../../../lib/admin-action';

export async function createSource(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const name=String(formData.get('name')??'').trim();
 const kind=String(formData.get('kind')??'').trim();
 const baseUrl=String(formData.get('baseUrl')??'').trim();
 const robotsPolicy=String(formData.get('robotsPolicy')??'').trim();
 const crawlDelayMs=Number(formData.get('crawlDelayMs')??'');
 if(!name||!kind||!baseUrl)return {ok:false,status:422};

 const body:Record<string,unknown>={name,kind,baseUrl};
 if(robotsPolicy)body.robotsPolicy=robotsPolicy;
 if(Number.isInteger(crawlDelayMs)&&crawlDelayMs>=250)body.crawlDelayMs=crawlDelayMs;

 const result=await adminMutate('/admin/sources',{method:'POST',body});
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/fontes');
 return {ok:true};
}

export async function createTarget(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const sourceId=String(formData.get('sourceId')??'').trim();
 const url=String(formData.get('url')??'').trim();
 const discoveryMode=String(formData.get('discoveryMode')??'').trim() || 'EDITORIAL';
 const scheduleKey=String(formData.get('scheduleKey')??'').trim();
 if(!sourceId||!url)return {ok:false,status:422};

 const body:Record<string,unknown>={sourceId,url,discoveryMode};
 if(scheduleKey)body.scheduleKey=scheduleKey;

 const result=await adminMutate('/admin/crawl-targets',{method:'POST',body});
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/fontes');
 return {ok:true};
}
