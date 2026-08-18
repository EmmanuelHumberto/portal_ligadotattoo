import { Body,Controller,Get,Post,Query } from '@nestjs/common';
import { Actor } from '../iam/actor.decorator';
import type {ActorContext} from '../iam/actor-context';
import { RequireCapability } from '../iam/require-capability.decorator';
import {
  crawlTargetInput,discoveryStatus,ingestionRunStatus,optionalUuid,sourceInput,
  sourceKindFilter,
} from './admin-ingestion.input';
import {CreateCrawlTargetHandler} from './create-crawl-target.handler';
import {CreateSourceHandler} from './create-source.handler';
import { IngestionQuery } from './ingestion.query';
import {RunIngestionHandler} from './run-ingestion.handler';

@Controller('admin')
export class IngestionController {
  constructor(
    private readonly query:IngestionQuery,
    private readonly createSourceHandler:CreateSourceHandler,
    private readonly createTargetHandler:CreateCrawlTargetHandler,
    private readonly runIngestionHandler:RunIngestionHandler,
  ) {}

  @Get('sources')
  @RequireCapability('source.read')
  sources(){ return this.query.sources(); }

  @Post('sources')
  @RequireCapability('source.write')
  createSource(@Body() body:unknown,@Actor() actor:ActorContext) {
    return this.createSourceHandler.execute(sourceInput(body),actor.actorId);
  }

  @Get('ingestion/runs')
  @RequireCapability('ingestion.read')
  runs(@Query('sourceId') sourceId?:string,@Query('status') status?:string) {
    return this.query.runs({sourceId:optionalUuid(sourceId,'sourceId'),
      status:ingestionRunStatus(status)});
  }

  @Post('ingestion/run')
  @RequireCapability('source.write')
  runIngestion(@Query('kind') kind?:string) {
    return this.runIngestionHandler.execute(sourceKindFilter(kind));
  }

  @Get('ingestion/discoveries')
  @RequireCapability('ingestion.read')
  discoveries(@Query('status') status='NEW') {
    return this.query.discoveries(discoveryStatus(status));
  }

  @Get('crawl-targets')
  @RequireCapability('source.read')
  targets(){ return this.query.targets(); }

  @Post('crawl-targets')
  @RequireCapability('source.write')
  createTarget(@Body() body:unknown,@Actor() actor:ActorContext) {
    return this.createTargetHandler.execute(crawlTargetInput(body),actor.actorId);
  }
}
