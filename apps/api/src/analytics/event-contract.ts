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

export function sanitizeEvent(input:any){
 if(!ANALYTICS_EVENTS.includes(input?.name))throw new Error('EVENT_NOT_ALLOWED');
 const properties=Object.fromEntries(
  Object.entries(input.properties??{})
   .filter(([k,v])=>allowedProps.has(k)&&
     ['string','number','boolean'].includes(typeof v))
   .slice(0,30)
 );
 return {
  name:input.name as AnalyticsEventName,
  anonymousSessionId:String(input.anonymousSessionId??'').slice(0,80),
  properties,
  occurredAt:new Date(input.occurredAt??Date.now()),
 };
}
