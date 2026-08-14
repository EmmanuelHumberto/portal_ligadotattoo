import { Controller, Get } from '@nestjs/common';
import { RequireCapability } from '../iam/require-capability.decorator';
import { LaboratoryQuery } from './laboratory.query';

@Controller('admin/laboratory')
export class LaboratoryController {
  constructor(private readonly query:LaboratoryQuery) {}

  @Get('sessions')
  @RequireCapability('laboratory.read')
  sessions(){ return this.query.sessions(); }
}
