import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global: her modulde ayrica import etmeye gerek kalmasin. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
