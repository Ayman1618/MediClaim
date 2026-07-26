import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict a route to one or more roles.
 * Used in conjunction with RolesGuard.
 *
 * @example
 * @Roles(Role.INSURER)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * getStats() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
