import { createHash, randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Yuklenen dosyanin gercekten iddia ettigi turde olup olmadigini
 * ilk baytlarindan (magic bytes) anliyoruz.
 *
 * Yalnizca Content-Type basligina guvenilemez: istemci onu serbestce
 * yazar. ".jpg" uzantili bir HTML dosyasi tarayicida calisabilirdi.
 */
const MAGIC: Array<{ mime: string; test: (b: Buffer) => boolean }> = [
  { mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  { mime: 'image/gif', test: (b) => b.subarray(0, 3).toString('ascii') === 'GIF' },
  {
    mime: 'image/webp',
    test: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

function detectImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  return MAGIC.find((m) => m.test(buffer))?.mime ?? null;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get uploadDir(): string {
    return this.config.get<string>('UPLOAD_DIR') ?? './uploads';
  }

  async upload(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    uploadedById: string,
  ) {
    const maxMb = Number(this.config.get('MAX_UPLOAD_MB') ?? 5);
    if (file.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`Dosya en fazla ${maxMb} MB olabilir.`);
    }

    const detected = detectImageType(file.buffer);
    if (!detected) {
      throw new BadRequestException(
        'Yalnizca JPEG, PNG, GIF veya WebP gorsel yuklenebilir.',
      );
    }

    // Gorseli sharp ile YENIDEN KODLUYORUZ. Bu, dosyaya gomulmus olabilecek
    // betik veya EXIF icindeki zararli veriyi eler; cikti temiz bir WebP olur.
    let output: Buffer;
    let width: number | undefined;
    let height: number | undefined;
    try {
      const pipeline = sharp(file.buffer, { animated: detected === 'image/gif' })
        .rotate() // EXIF yonlendirmesini uygula, sonra metadatayi birak
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 });

      output = await pipeline.toBuffer();
      const meta = await sharp(output).metadata();
      width = meta.width;
      height = meta.height;
    } catch {
      throw new BadRequestException('Gorsel islenemedi. Dosya bozuk olabilir.');
    }

    // Dosya adi istemciden ALINMAZ: "../../etc/passwd" gibi yollar
    // dizin disina yazmaya calisirdi.
    const name = `${Date.now()}-${randomBytes(8).toString('hex')}.webp`;
    const dir = this.uploadDir;
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), output);

    return this.prisma.mediaAsset.create({
      data: {
        filename: name,
        url: `/uploads/${name}`,
        mimeType: 'image/webp',
        sizeBytes: output.length,
        width: width ?? null,
        height: height ?? null,
        uploadedById,
      },
    });
  }

  list(limit = 60) {
    return this.prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, limit),
    });
  }

  async remove(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Dosya bulunamadi.');

    // Once veritabani kaydini sil; disk silme basarisiz olsa bile
    // yonetimde hayalet kayit kalmasin.
    await this.prisma.mediaAsset.delete({ where: { id } });
    await unlink(join(this.uploadDir, asset.filename)).catch(() => undefined);

    return { deleted: true };
  }

  /** Ayni dosyanin tekrar yuklenmesini tespit etmek icin (ileride kullanilacak). */
  static checksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
