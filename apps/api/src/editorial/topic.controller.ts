import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { RequireCapability } from '../iam/require-capability.decorator';
import {editorialTopicInput,editorialTopicStatusInput} from './admin-editorial.input';
import {EditorialTopicRepository} from './editorial-topic.repository';

@Controller('admin/editorial-topics')
export class EditorialTopicController {
  constructor(private readonly topics:EditorialTopicRepository) {}

  @Get()
  @RequireCapability('editorial.read')
  list() {return this.topics.list();}

  @Post()
  @RequireCapability('editorial.write')
  create(@Body() body:unknown) {return this.topics.create(editorialTopicInput(body));}

  @Post('run')
  @RequireCapability('editorial.write')
  run() {return this.topics.enqueueDiscovery();}

  @Put(':id/status')
  @RequireCapability('editorial.write')
  setStatus(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown) {
    return this.topics.setStatus(id,editorialTopicStatusInput(body));
  }
}
