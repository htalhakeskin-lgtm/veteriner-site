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
  @ApiOperation({ summary: 'Hayvanlarım' })
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
  @ApiOperation({ summary: 'Hayvanı kaldır (yumuşak silme)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pets.remove(id, user);
  }

  @Get('pets/:id/medical-records')
  @ApiOperation({ summary: 'Sağlık kartı' })
  medicalRecords(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pets.medicalRecords(id, user);
  }

  @Get('pets/:id/vaccination-schedule')
  @ApiOperation({ summary: 'Yaklaşan aşı ve kontroller' })
  vaccinations(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pets.vaccinationSchedule(id, user);
  }

  // ── Admin / personel ──

  @Get('admin/pets')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Tüm hasta kayıtları' })
  findAllAdmin(@Query('q') q?: string, @Query('ownerId') ownerId?: string) {
    return this.pets.findAllAdmin({ q, ownerId });
  }

  @Post('admin/medical-records')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Sağlık kaydı gir' })
  createRecord(@Body() dto: CreateMedicalRecordDto) {
    return this.pets.createMedicalRecord(dto);
  }

  @Delete('admin/medical-records/:id')
  @Roles('ADMIN', 'STAFF')
  removeRecord(@Param('id') id: string) {
    return this.pets.removeMedicalRecord(id);
  }
}
