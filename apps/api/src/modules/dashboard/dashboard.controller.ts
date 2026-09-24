import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@Roles('ADMIN', 'STAFF')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Özet sayılar' })
  overview() {
    return this.dashboard.overview();
  }

  @Get('today')
  @ApiOperation({ summary: 'Bugünün randevu listesi' })
  today() {
    return this.dashboard.todaySchedule();
  }

  @Get('trend')
  @ApiOperation({ summary: 'Günlük randevu grafiği' })
  trend(@Query('days') days?: string) {
    return this.dashboard.appointmentTrend(days ? Number(days) : undefined);
  }

  @Get('top-services')
  @ApiOperation({ summary: 'En çok tercih edilen hizmetler' })
  topServices(@Query('limit') limit?: string) {
    return this.dashboard.topServices(limit ? Number(limit) : undefined);
  }
}
