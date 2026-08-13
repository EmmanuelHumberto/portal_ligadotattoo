import { Controller,Get } from '@nestjs/common';
import { RequireCapability } from '../iam/require-capability.decorator';
import { AIRegistryRepository } from './ai-registry.repository';

@Controller('admin/ai')
export class AIAdminController {
  constructor(private readonly registry:AIRegistryRepository){}

  @Get('registry')
  @RequireCapability('ai.config.read')
  registryView(){return this.registry.registry();}

  @Get('executions')
  @RequireCapability('ai.execution.read')
  executions(){return this.registry.executions();}
}
