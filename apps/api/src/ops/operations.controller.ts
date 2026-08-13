import {
  Controller,Get,NotFoundException,Param,Query,
} from '@nestjs/common';
import { RequireCapability } from '../iam/require-capability.decorator';
import { AuditQuery } from './audit.query';
import { OperationsQuery } from './operations.query';
import { ReadinessService } from './readiness.service';

@Controller('admin')
export class OperationsController {
  constructor(
    private readonly audit:AuditQuery,
    private readonly ops:OperationsQuery,
    private readonly readiness:ReadinessService,
  ) {}

  @Get('audit')
  @RequireCapability('audit.read')
  auditList(
    @Query('actorId') actorId?:string,@Query('action') action?:string,
    @Query('subjectType') subjectType?:string,@Query('subjectId') subjectId?:string,
    @Query('from') from?:string,@Query('to') to?:string,
  ) {
    return this.audit.list({actorId,action,subjectType,subjectId,from,to});
  }

  @Get('audit/:id')
  @RequireCapability('audit.read')
  async auditDetail(@Param('id') id:string) {
    const x=await this.audit.detail(id);
    if (!x) throw new NotFoundException('Audit event not found');
    return x;
  }

  @Get('operations/dashboard')
  @RequireCapability('operations.read')
  dashboard(){return this.ops.dashboard();}

  @Get('operations/jobs')
  @RequireCapability('operations.read')
  jobs(@Query('status') status?:string){return this.ops.jobs(status);}

  @Get('operations/outbox')
  @RequireCapability('operations.read')
  outbox(@Query('status') status?:string){return this.ops.outbox(status);}

  @Get('operations/dead-letters')
  @RequireCapability('operations.read')
  deadLetters(){return this.ops.deadLetters();}

  @Get('operations/cache-invalidations')
  @RequireCapability('operations.read')
  cache(){return this.ops.cacheInvalidations();}

  @Get('operations/readiness')
  @RequireCapability('operations.read')
  readinessView(){return this.readiness.readiness();}
}
