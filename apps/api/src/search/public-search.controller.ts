import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../iam/public.decorator';
import { PublicSearchQuery } from './public-search.query';

@Controller('public/search')
@Public()
export class PublicSearchController {
  constructor(private readonly searchQuery:PublicSearchQuery) {}

  @Get()
  search(
    @Query('q') q='',
    @Query('limit') limit='24',
    @Query('cursor') cursor?:string,
  ) {
    return this.searchQuery.search(q,Number(limit),cursor);
  }

  @Get('suggest')
  suggest(@Query('q') q='') {
    return this.searchQuery.suggest(q);
  }
}
