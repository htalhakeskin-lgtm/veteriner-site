import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Tüm hataları tek bir gövde şekline indirger; böylece frontend'de
 * her uç için ayrı hata ayıklama mantığı yazmak gerekmez.
 *
 *   { statusCode, error, message, code, timestamp, path }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Beklenmeyen bir hata oluştu.';
    let error = 'Internal Server Error';
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      // error alanını önce durum kodundan türet. Nesne gövdeli exception'larda
      // (or. BadRequestException({message, code})) Nest bu alanı doldurmuyor;
      // varsayılanda bırakılsaydı 400 yanıtında "Internal Server Error"
      // yazar ve istemciyi yanlış yönlendirirdi.
      error = statusText(status);
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        // Validation hatalarında message bir dizi olabilir
        message = Array.isArray(b.message)
          ? (b.message as string[]).join(', ')
          : ((b.message as string) ?? message);
        error = (b.error as string) ?? error;
        code = b.code as string | undefined;
      }
    } else if (exception instanceof Error) {
      // Beklenmeyen hata: istemciye iç detay sızdırmıyoruz, loga tam hali gidiyor.
      this.logger.error(exception.message, exception.stack);
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} -> ${status}: ${message}`);
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      ...(code ? { code } : {}),
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}

/** HTTP durum kodunun standart metin karşılığı. */
function statusText(status: number): string {
  const key = Object.keys(HttpStatus).find(
    (k) => HttpStatus[k as keyof typeof HttpStatus] === status,
  );
  if (!key) return 'Error';
  // NOT_FOUND -> Not Found
  return key
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
