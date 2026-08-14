import { Body, Controller, Get, Put } from '@nestjs/common';
import { RequireCapability } from '../iam/require-capability.decorator';
import { PipelineConfigRepository } from './pipeline-config.repository';

@Controller('admin/editorial-config')
export class PipelineConfigController {
  constructor(private readonly config:PipelineConfigRepository) {}

  @Get('auto-draft')
  @RequireCapability('editorial.read')
  async autoDraft() {
    return {enabled: await this.config.getAutoDraftEnabled()};
  }

  @Put('auto-draft')
  @RequireCapability('editorial.write')
  async setAutoDraft(@Body() body:any) {
    return {enabled: await this.config.setAutoDraftEnabled(Boolean(body?.enabled))};
  }
}
