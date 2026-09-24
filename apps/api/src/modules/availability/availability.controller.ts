import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { AvailabilityService } from './availability.service';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Müsait randevu saatleri' })
  @ApiQuery({ name: 'serviceId', required: false })
  @ApiQuery({ name: 'serviceSlug', required: false })
  @ApiQuery({ name: 'staffId', required: false, description: 'Boş ise tüm uygun hekimler' })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-05' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-12' })
  get(
    @Query('serviceId') serviceId?: string,
    @Query('serviceSlug') serviceSlug?: string,
    @Query('staffId') staffId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.availability.getAvailability({ serviceId, serviceSlug, staffId, from, to });
  }
}
