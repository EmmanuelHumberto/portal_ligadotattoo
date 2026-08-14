import { Controller, Get } from '@nestjs/common';
import { RequireCapability } from '../iam/require-capability.decorator';
import { ServiceQuery } from './service.query';

@Controller('admin/technical-issues')
export class ServiceController {
  constructor(private readonly query:ServiceQuery) {}

  @Get()
  @RequireCapability('service.read')
  list(){ return this.query.issues(); }
}
