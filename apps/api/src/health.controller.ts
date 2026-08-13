import {Controller,Get} from '@nestjs/common';
import {Public} from './iam/public.decorator';
@Public()
@Controller('health')
export class HealthController{
 @Get('live') live(){return {status:'UP',service:'api'};}
 @Get('ready') ready(){return {status:'UP',service:'api'};}
}
