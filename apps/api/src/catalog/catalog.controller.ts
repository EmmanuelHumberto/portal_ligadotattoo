import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateManufacturerHandler } from './create-manufacturer.handler';

@Controller('admin/manufacturers')
export class CatalogController {
  constructor(private readonly createManufacturer: CreateManufacturerHandler) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: {
    name: string; slug: string; officialWebsite?: string; countryCode?: string;
  }) {
    const m = await this.createManufacturer.execute(body);
    return {
      id: m.id, name: m.name, slug: m.slug,
      officialWebsite: m.officialWebsite,
      countryCode: m.countryCode,
      status: m.status, version: m.version,
    };
  }
}
