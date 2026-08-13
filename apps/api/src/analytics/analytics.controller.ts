import {Body,Controller,Post,Req} from '@nestjs/common';
import {Public} from '../iam/public.decorator';
import {AnalyticsIngestService} from './analytics-ingest.service';

@Controller('analytics')
export class AnalyticsController {
 constructor(private readonly ingest:AnalyticsIngestService){}
 @Post('events')
 @Public()
 async event(@Body() body:any,@Req() req:any){
  await this.ingest.accept(body,{
   ip:req.ip,userAgent:req.headers['user-agent'],
  });
  return {accepted:true};
 }
}
