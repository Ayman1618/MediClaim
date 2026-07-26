import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard that enforces JWT authentication on a route.
 *
 * Returns 401 Unauthorized when:
 * - No Authorization header is present
 * - Token is malformed
 * - Token has expired
 * - Token subject no longer maps to a valid user
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  override handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Authentication required. Please log in.');
    }
    return user;
  }
}
