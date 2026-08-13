import {Controller,Get,NotFoundException,Param} from '@nestjs/common';
import {Public} from '../iam/public.decorator';
import {PublicManufacturerQuery} from './public-manufacturer.query';

@Controller('public/manufacturers')
@Public()
export class PublicManufacturerController {
 constructor(private readonly manufacturers:PublicManufacturerQuery) {}

 @Get()
 list(){return this.manufacturers.list();}

 @Get(':slug')
 async detail(@Param('slug') slug:string) {
  const result=await this.manufacturers.bySlug(slug);
  if(!result)throw new NotFoundException('Manufacturer not found');
  return result;
 }
}
