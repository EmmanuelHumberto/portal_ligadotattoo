import {analyticsSessionId} from './analytics-session';

export function emitProductEvent(name:string,properties:Record<string,unknown>={}){
 const body={
  name,anonymousSessionId:analyticsSessionId(),
  properties,occurredAt:new Date().toISOString(),
 };
 navigator.sendBeacon?.('/api/analytics/events',
  new Blob([JSON.stringify(body)],{type:'application/json'}));
}
