import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * JwtAuthGuard global çalışır; bu dekoratör taşıyan uçlar dışarıda kalır.
 * Varsayılan "kapalı", istisna "açık" — tersi olsaydı yeni bir uç yazıp
 * korumayı unutmak sessizce açık kapı bırakırdı.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
