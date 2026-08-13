'use client';
import {useReportWebVitals} from 'next/web-vitals';

const names=new Set(['CLS','FCP','INP','LCP','TTFB']);

export function WebVitals(){
 useReportWebVitals(metric=>{
  if(!names.has(metric.name))return;
  const body={
   name:metric.name,value:metric.value,rating:metric.rating,
   navigationType:metric.navigationType,
  };
  navigator.sendBeacon?.('/api/vitals',
   new Blob([JSON.stringify(body)],{type:'application/json'}));
 });
 return null;
}
