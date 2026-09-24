import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffService } from './staff.service';

@ApiTags('staff')
@Controller()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Public()
  @Get('staff')
  @ApiOperation({ summary: 'Aktif personel' })
  findAll() {
    return this.staff.findAll();
  }

  @Public()
  @Get('staff/:slug')
  @ApiOperation({ summary: 'Personel detayı' })
  findOne(@Param('slug') slug: string) {
    return this.staff.findBySlug(slug);
  }

  @Get('admin/staff')
  @Roles('ADMIN')
  findAllAdmin() {
    return this.staff.findAllAdmin();
  }

  @Post('admin/staff')
  @Roles('ADMIN')
  create(@Body() body: Record<string, unknown>) {
    return this.staff.create(body);
  }

  @Patch('admin/staff/:id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.staff.update(id, body);
  }

  @Delete('admin/staff/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Personeli pasife al' })
  deactivate(@Param('id') id: string) {
    return this.staff.deactivate(id);
  }

  @Put('admin/staff/:id/schedule')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Haftalık çalışma takvimini değiştir' })
  setSchedule(
    @Param('id') id: string,
    @Body() body: { windows: Array<{ dayOfWeek: number; startTime: string; endTime: string }> },
  ) {
    return this.staff.setSchedule(id, body.windows ?? []);
  }

  @Post('admin/staff/:id/time-off')
  @Roles('ADMIN')
  addTimeOff(@Param('id') id: string, @Body() body: { startAt: string; endAt: string; reason?: string }) {
    return this.staff.addTimeOff(id, body);
  }

  @Delete('admin/staff/time-off/:timeOffId')
  @Roles('ADMIN')
  removeTimeOff(@Param('timeOffId') timeOffId: string) {
    return this.staff.removeTimeOff(timeOffId);
  }
}
