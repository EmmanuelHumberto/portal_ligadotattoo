import {Controller,Get} from '@nestjs/common';
import {Public} from './iam/public.decorator';
@Public()
@Controller('system')
export class SystemController{
 @Get('architecture') architecture(){
  return {version:'AR-43',services:['web','api','worker'],
   aiProviderHub:{providerNeutral:true,backendOnly:true}};
 }
}
