import { createHash, randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Yüklenen dosyanın gerçekten iddia ettiği türde olup olmadığını
 * ilk baytlarından (magic bytes) anlıyoruz.
 *
 * Yalnızca Content-Type başlığına güvenilemez: istemci onu serbestçe
 * yazar. ".jpg" uzantılı bir HTML dosyası tarayıcıda çalışabilirdi.
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
        'Yalnızca JPEG, PNG, GIF veya WebP görsel yüklenebilir.',
      );
    }

    // Görseli sharp ile YENIDEN KODLUYORUZ. Bu, dosyaya gömülmüş olabilecek
    // betik veya EXIF içindeki zararlı veriyi eler; çıktı temiz bir WebP olur.
    let output: Buffer;
    let width: number | undefined;
    let height: number | undefined;
    try {
      const pipeline = sharp(file.buffer, { animated: detected === 'image/gif' })
        .rotate() // EXIF yönlendirmesini uygula, sonra metadatayı bırak
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 });

      output = await pipeline.toBuffer();
      const meta = await sharp(output).metadata();
      width = meta.width;
      height = meta.height;
    } catch {
      throw new BadRequestException('Görsel işlenemedi. Dosya bozuk olabilir.');
    }

    // Dosya adı istemciden ALINMAZ: "../../etc/passwd" gibi yollar
    // dizin dışına yazmaya çalışırdı.
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
    if (!asset) throw new NotFoundException('Dosya bulunamadı.');

    // Önce veritabanı kaydını sil; disk silme başarısız olsa bile
    // yönetimde hayalet kayıt kalmasın.
    await this.prisma.mediaAsset.delete({ where: { id } });
    await unlink(join(this.uploadDir, asset.filename)).catch(() => undefined);

    return { deleted: true };
  }

  /** Aynı dosyanın tekrar yüklenmesini tespit etmek için (ileride kullanılacak). */
  static checksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
