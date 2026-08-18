import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { RequireCapability } from '../iam/require-capability.decorator';
import {autoDraftConfigInput} from './admin-editorial.input';
import { PipelineConfigRepository } from './pipeline-config.repository';
import {RunEditorialAutoDraftHandler} from './run-editorial-auto-draft.handler';

@Controller('admin/editorial-config')
export class PipelineConfigController {
  constructor(
    private readonly config:PipelineConfigRepository,
    private readonly runAutoDraftHandler:RunEditorialAutoDraftHandler,
  ) {}

  @Get('auto-draft')
  @RequireCapability('editorial.read')
  async autoDraft() {
    return {enabled: await this.config.getAutoDraftEnabled()};
  }

  @Put('auto-draft')
  @RequireCapability('editorial.write')
  async setAutoDraft(@Body() body:unknown) {
    return {enabled:await this.config.setAutoDraftEnabled(autoDraftConfigInput(body))};
  }

  @Post('auto-draft/run')
  @RequireCapability('editorial.write')
  runAutoDraft() {return this.runAutoDraftHandler.execute();}
}
