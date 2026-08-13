import {Controller,Get,Query} from '@nestjs/common';
import {RequireCapability} from '../iam/require-capability.decorator';
import {FunnelQuery} from './funnel.query';
import {QualityQuery} from './quality.query';

@Controller('admin/intelligence')
export class AdminIntelligenceController {
 constructor(private readonly funnels:FunnelQuery,private readonly quality:QualityQuery){}

 @Get('overview')
 @RequireCapability('analytics.read')
 async overview(@Query('days') days='30'){
  const n=Math.min(Math.max(Number(days)||30,1),365);
  const [discovery,search,productQuality,opportunities]=await Promise.all([
   this.funnels.discovery(n),this.funnels.search(n),
   this.quality.productQuality(),this.quality.contentOpportunities(),
  ]);
  return {windowDays:n,discovery,search,productQuality,
   topContentOpportunities:opportunities.items.slice(0,10)};
 }

 @Get('content-opportunities')
 @RequireCapability('analytics.read')
 opportunities(){return this.quality.contentOpportunities();}
}
