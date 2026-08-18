import {Body,Controller,Post,Req} from '@nestjs/common';
import type {Request} from 'express';
import {Public} from '../iam/public.decorator';
import {AnalyticsIngestService} from './analytics-ingest.service';

@Controller('analytics')
export class AnalyticsController {
 constructor(private readonly ingest:AnalyticsIngestService){}
 @Post('events')
 @Public()
 async event(@Body() body:unknown,@Req() req:Request){
  await this.ingest.accept(body,{
   ip:req.ip,userAgent:req.headers['user-agent'],
  });
  return {accepted:true};
 }
}
