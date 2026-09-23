import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ContactService } from './contact.service';
import { ContactMessageDto, SubscribeDto } from './dto/contact.dto';

@ApiTags('contact')
@Controller()
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Public()
  @Post('contact')
  @HttpCode(HttpStatus.OK)
  // Spam korumasi: honeypot + saatte 3 mesaj.
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Iletisim formu gonder' })
  submit(@Body() dto: ContactMessageDto, @Req() req: Request) {
    return this.contact.submit(dto, req.ip);
  }

  @Public()
  @Post('newsletter/subscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'E-bultene abone ol' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.contact.subscribe(dto);
  }

  @Public()
  @Get('newsletter/unsubscribe/:token')
  @ApiOperation({ summary: 'Abonelikten cik' })
  unsubscribe(@Param('token') token: string) {
    return this.contact.unsubscribe(token);
  }

  // ── Admin ──

  @Get('admin/contact-messages')
  @Roles('ADMIN')
  findAllAdmin(@Query('isRead') isRead?: string) {
    return this.contact.findAllAdmin({
      isRead: isRead === undefined ? undefined : isRead === 'true',
    });
  }

  @Get('admin/contact-messages/unread-count')
  @Roles('ADMIN')
  unreadCount() {
    return this.contact.unreadCount();
  }

  @Patch('admin/contact-messages/:id/read')
  @Roles('ADMIN')
  markRead(@Param('id') id: string) {
    return this.contact.markRead(id);
  }

  @Patch('admin/contact-messages/:id/replied')
  @Roles('ADMIN')
  markReplied(@Param('id') id: string) {
    return this.contact.markReplied(id);
  }

  @Delete('admin/contact-messages/:id')
  @Roles('ADMIN')
  removeMessage(@Param('id') id: string) {
    return this.contact.removeMessage(id);
  }

  @Get('admin/newsletter')
  @Roles('ADMIN')
  listSubscribers() {
    return this.contact.listSubscribers();
  }

  @Get('admin/newsletter/export')
  @Roles('ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="e-bulten-aboneleri.csv"')
  @ApiOperation({ summary: 'Abone listesini CSV indir' })
  exportCsv() {
    return this.contact.exportSubscribersCsv();
  }
}
