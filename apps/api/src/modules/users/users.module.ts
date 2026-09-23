import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule], // TokenService: sifre degisiminde oturumlari iptal icin
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
