import type { Role } from '@prisma/client';

/** Access token'in icindeki veri. Kisa tutuluyor: token her istekte tasiniyor. */
export interface JwtPayload {
  sub: string; // kullanici id
  email: string;
  role: Role;
}

/** Guard'in request'e yazdigi, controller'larin @CurrentUser ile aldigi nesne. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** Express Request'e kullanici alanini ekler. */
declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
