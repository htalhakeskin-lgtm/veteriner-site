import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get('settings')
  @ApiOperation({ summary: 'Site ayarları (herkese açık alt küme)' })
  getPublic() {
    return this.settings.getPublic();
  }

  @Get('admin/settings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tüm site ayarları' })
  getAll() {
    return this.settings.getAll();
  }

  @Patch('admin/settings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Site ayarlarını güncelle' })
  update(@Body() body: Record<string, unknown>) {
    return this.settings.update(body);
  }
}
