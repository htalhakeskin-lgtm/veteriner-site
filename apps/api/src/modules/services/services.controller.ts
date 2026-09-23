import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller()
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Public()
  @Get('services')
  @ApiOperation({ summary: 'Aktif hizmetler' })
  findAll(@Query('category') category?: string, @Query('featured') featured?: string) {
    return this.services.findAll({
      category,
      featured: featured === undefined ? undefined : featured === 'true',
    });
  }

  @Public()
  @Get('services/:slug')
  @ApiOperation({ summary: 'Hizmet detayi' })
  findOne(@Param('slug') slug: string) {
    return this.services.findBySlug(slug);
  }

  @Get('admin/services')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tum hizmetler (pasifler dahil)' })
  findAllAdmin() {
    return this.services.findAllAdmin();
  }

  @Post('admin/services')
  @Roles('ADMIN')
  create(@Body() body: Record<string, unknown>) {
    return this.services.create(body);
  }

  @Patch('admin/services/reorder')
  @Roles('ADMIN')
  reorder(@Body() body: { items: Array<{ id: string; sortOrder: number }> }) {
    return this.services.reorder(body.items ?? []);
  }

  @Patch('admin/services/:id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.services.update(id, body);
  }

  @Delete('admin/services/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Hizmeti pasife al (silmez)' })
  deactivate(@Param('id') id: string) {
    return this.services.deactivate(id);
  }
}
