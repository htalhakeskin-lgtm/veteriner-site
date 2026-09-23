import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth.types';
import { AppointmentsService } from './appointments.service';
import {
  CancelAppointmentDto, CreateAppointmentDto, RescheduleAppointmentDto,
} from './dto/appointments.dto';

@ApiTags('appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Public()
  @Post('appointments')
  // Misafir de randevu alabiliyor; sahte kayit yagmurunu sinirla.
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Randevu olustur (misafir de alabilir)' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user?: AuthUser) {
    return this.appointments.create(dto, user?.id);
  }

  @Public()
  @Get('appointments/lookup')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Randevu sorgula (kod + telefon)' })
  lookup(@Query('code') code: string, @Query('phone') phone: string) {
    return this.appointments.lookup(code ?? '', phone ?? '');
  }

  @Get('appointments/me')
  @ApiOperation({ summary: 'Randevularim' })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    return this.appointments.findMine(user.id, {
      status,
      upcoming: upcoming === 'true',
    });
  }

  @Get('appointments/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.appointments.findOne(id, user);
  }

  @Patch('appointments/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Randevuyu iptal et' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointments.cancel(id, user, dto.reason);
  }

  @Patch('appointments/:id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Randevuyu ertele' })
  reschedule(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointments.reschedule(id, user, dto);
  }

  // ── Admin ──

  @Get('admin/appointments')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Randevu listesi / takvim' })
  findAllAdmin(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
    @Query('q') q?: string,
  ) {
    return this.appointments.findAllAdmin({ from, to, status, staffId, q });
  }

  @Patch('admin/appointments/:id/status')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Randevu durumunu degistir' })
  setStatus(
    @Param('id') id: string,
    @Body() body: { status: AppointmentStatus; reason?: string },
  ) {
    return this.appointments.setStatus(id, body.status, body.reason);
  }
}
