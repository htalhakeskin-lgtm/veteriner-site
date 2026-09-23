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
  @ApiOperation({ summary: 'Site ayarlari (herkese acik alt kume)' })
  getPublic() {
    return this.settings.getPublic();
  }

  @Get('admin/settings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tum site ayarlari' })
  getAll() {
    return this.settings.getAll();
  }

  @Patch('admin/settings')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Site ayarlarini guncelle' })
  update(@Body() body: Record<string, unknown>) {
    return this.settings.update(body);
  }
}
