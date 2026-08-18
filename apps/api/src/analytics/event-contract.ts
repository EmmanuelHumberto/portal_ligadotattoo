export const ANALYTICS_EVENTS=[
 'page_view','product_open','search_submit','search_result_open',
 'filter_apply','compare_add','compare_complete','favorite_toggle',
 'offer_open','editorial_open','editorial_complete','event_open',
 'experiment_exposure',
] as const;
export type AnalyticsEventName=typeof ANALYTICS_EVENTS[number];

const allowedProps=new Set([
 'productId','contentId','eventId','listingId','brandId','categoryId',
 'resultPosition','resultCount','filterCount','compareCount',
 'contentType','experimentId','variant','referrerClass','routeClass',
]);

export function sanitizeEvent(raw:unknown){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))
  throw new BadRequestException('Invalid analytics event');
 const input=raw as Record<string,unknown>;
 if(!ANALYTICS_EVENTS.includes(input.name as AnalyticsEventName))
  throw new BadRequestException('EVENT_NOT_ALLOWED');
 const session=typeof input.anonymousSessionId==='string'
  ? input.anonymousSessionId.trim():'';
 if(!/^[A-Za-z0-9._:-]{1,80}$/.test(session))
  throw new BadRequestException('SESSION_REQUIRED');
 const rawProperties=input.properties;
 const entries=rawProperties&&typeof rawProperties==='object'&&!Array.isArray(rawProperties)
  ? Object.entries(rawProperties):[];
 const properties=Object.fromEntries(
  entries
   .filter(([k,v])=>allowedProps.has(k)&&
     ['string','number','boolean'].includes(typeof v))
   .slice(0,30)
 );
 return {
  name:input.name as AnalyticsEventName,
  anonymousSessionId:session,
  properties,
  occurredAt:eventDate(input.occurredAt),
 };
}

function eventDate(value:unknown){
 const date=value===undefined?new Date():new Date(String(value));
 if(Number.isNaN(date.getTime()))throw new BadRequestException('INVALID_OCCURRED_AT');
 const drift=Math.abs(Date.now()-date.getTime());
 if(drift>1000*60*60*24*31)throw new BadRequestException('OCCURRED_AT_OUT_OF_RANGE');
 return date;
}
import {BadRequestException} from '@nestjs/common';
