import {Controller,Get,Res} from '@nestjs/common';
import type {Response} from 'express';
import {Public} from './iam/public.decorator';
import {DatabaseReadinessService} from './platform/database-readiness.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly database:DatabaseReadinessService) {}

  @Get('live')
  live(){return {status:'UP',service:'api'};}

  @Get('ready')
  async ready(@Res({passthrough:true}) response:Response){
    const database=await this.database.check();
    const status=database.status==='UP'?'UP':'DOWN';
    response.status(status==='UP'?200:503);
    return {
      status,service:'api',checks:[database],checkedAt:new Date().toISOString(),
    };
  }
}
