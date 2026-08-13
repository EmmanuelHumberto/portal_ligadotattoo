import {Injectable} from '@nestjs/common';

@Injectable()
export class PublicAbuseService {
 assess(input:{
  method:string;path:string;userAgent?:string;
  requestRate?:number;failedRate?:number;
 }){
  let score=0;
  if(!input.userAgent)score+=10;
  if((input.requestRate??0)>120)score+=40;
  if((input.failedRate??0)>30)score+=25;
  if(/wp-admin|\.env|phpmyadmin/i.test(input.path))score+=30;
  return {
   score,
   action:score>=70?'BLOCK':score>=40?'CHALLENGE':'ALLOW',
  } as const;
 }
}
