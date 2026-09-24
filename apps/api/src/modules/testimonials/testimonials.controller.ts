import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TestimonialsService } from './testimonials.service';

@ApiTags('testimonials')
@Controller()
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Public()
  @Get('testimonials')
  @ApiOperation({ summary: 'Onaylı müşteri yorumları' })
  findApproved(@Query('limit') limit?: string) {
    return this.testimonials.findApproved(limit ? Number(limit) : undefined);
  }

  @Public()
  @Get('testimonials/rating')
  @ApiOperation({ summary: 'Ortalama puan (JSON-LD için)' })
  rating() {
    return this.testimonials.aggregateRating();
  }

  @Get('admin/testimonials')
  @Roles('ADMIN')
  findAllAdmin(@Query('approved') approved?: string, @Query('source') source?: string) {
    return this.testimonials.findAllAdmin({
      approved: approved === undefined ? undefined : approved === 'true',
      source,
    });
  }

  @Post('admin/testimonials')
  @Roles('ADMIN')
  create(@Body() body: Record<string, unknown>) {
    return this.testimonials.create(body);
  }

  @Patch('admin/testimonials/:id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.testimonials.update(id, body);
  }

  @Delete('admin/testimonials/:id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.testimonials.remove(id);
  }

  @Post('admin/testimonials/sync-google')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Google yorumlarını şimdi senkronize et' })
  syncGoogle() {
    return this.testimonials.syncGoogleReviews();
  }
}
