import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth.types';
import {
  CreateMedicalRecordDto,
  CreatePetDto,
  UpdatePetDto,
} from './dto/pets.dto';
import { PetsService } from './pets.service';

@ApiTags('pets')
@ApiBearerAuth()
@Controller()
export class PetsController {
  constructor(private readonly pets: PetsService) {}

  @Get('pets')
  @ApiOperation({ summary: 'Hayvanlarim' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.pets.findMine(user.id);
  }

  @Post('pets')
  @ApiOperation({ summary: 'Yeni hayvan ekle' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePetDto) {
    return this.pets.create(user.id, dto);
  }

  @Get('pets/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pets.findOne(id, user);
  }

  @Patch('pets/:id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePetDto,
  ) {
    return this.pets.update(id, user, dto);
  }

  @Delete('pets/:id')
  @ApiOperation({ summary: 'Hayvani kaldir (yumusak silme)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pets.remove(id, user);
  }

  @Get('pets/:id/medical-records')
  @ApiOperation({ summary: 'Saglik karti' })
  medicalRecords(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pets.medicalRecords(id, user);
  }

  @Get('pets/:id/vaccination-schedule')
  @ApiOperation({ summary: 'Yaklasan asi ve kontroller' })
  vaccinations(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pets.vaccinationSchedule(id, user);
  }

  // ── Admin / personel ──

  @Get('admin/pets')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Tum hasta kayitlari' })
  findAllAdmin(@Query('q') q?: string, @Query('ownerId') ownerId?: string) {
    return this.pets.findAllAdmin({ q, ownerId });
  }

  @Post('admin/medical-records')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Saglik kaydi gir' })
  createRecord(@Body() dto: CreateMedicalRecordDto) {
    return this.pets.createMedicalRecord(dto);
  }

  @Delete('admin/medical-records/:id')
  @Roles('ADMIN', 'STAFF')
  removeRecord(@Param('id') id: string) {
    return this.pets.removeMedicalRecord(id);
  }
}
