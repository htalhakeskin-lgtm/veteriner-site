import {
  Controller, Delete, Get, Param, Post, Query,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth.types';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth()
@Controller('admin/media')
@Roles('ADMIN', 'STAFF')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'Yüklenen görseller' })
  list(@Query('limit') limit?: string) {
    return this.media.list(limit ? Number(limit) : undefined);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Görsel yükle (WebP olarak yeniden kodlanır)' })
  // Bellekte tutuluyor: sharp ile yeniden kodlamadan önce diske
  // hiç dokunmuyoruz, böylece işlenmemiş dosya sunucuda kalmıyor.
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    @CurrentUser() user: AuthUser,
  ) {
    return this.media.upload(file, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.media.remove(id);
  }
}
