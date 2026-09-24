import type { Role } from '@prisma/client';

/** Access token'in içindeki veri. Kısa tutuluyor: token her istekte taşınıyor. */
export interface JwtPayload {
  sub: string; // kullanıcı id
  email: string;
  role: Role;
}

/** Guard'in request'e yazdigi, controller'ların @CurrentUser ile aldığı nesne. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** Express Request'e kullanıcı alanını ekler. */
declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
