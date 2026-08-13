import {Global,Module} from '@nestjs/common';
import {APP_GUARD} from '@nestjs/core';
import {OriginCsrfGuard} from './origin-csrf.guard';
import {PublicAbuseService} from './public-abuse.service';
import {RateLimitGuard} from './rate-limit.guard';

@Global()
@Module({
 providers:[
  OriginCsrfGuard,PublicAbuseService,
  {provide:APP_GUARD,useClass:RateLimitGuard},
 ],
 exports:[OriginCsrfGuard,PublicAbuseService],
})
export class SecurityModule{}
