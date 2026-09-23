import { SetMetadata } from '@nestjs/common';
import type { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** @Roles('ADMIN') — RolesGuard bu listeyi okur. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
