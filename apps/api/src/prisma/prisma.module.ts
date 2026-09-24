import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global: her modülde ayrıca import etmeye gerek kalmasın. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
