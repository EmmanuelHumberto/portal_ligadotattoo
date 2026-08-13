import http from 'k6/http';
import {check,sleep} from 'k6';
export const options={
 scenarios:{
  public_read:{
   executor:'ramping-vus',
   stages:[
    {duration:'1m',target:20},
    {duration:'3m',target:50},
    {duration:'1m',target:0},
   ],
  },
 },
 thresholds:{
  http_req_failed:['rate<0.01'],
  http_req_duration:['p(95)<500'],
 },
};
export default function(){
 const base=__ENV.BASE_URL;
 const routes=['/','/maquinas','/robots.txt','/sitemap.xml'];
 const r=http.get(base+routes[Math.floor(Math.random()*routes.length)]);
 check(r,{'2xx/3xx':x=>x.status>=200&&x.status<400});
 sleep(Math.random()*2);
}
