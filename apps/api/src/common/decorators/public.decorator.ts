import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * JwtAuthGuard global calisir; bu dekorator tasiyan uclar disarida kalir.
 * Varsayilan "kapali", istisna "acik" — tersi olsaydi yeni bir uc yazip
 * korumayi unutmak sessizce acik kapi birakirdi.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
