import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../../users/schemas/user.schema';

/**
 * Route parameter decorator that extracts the authenticated user
 * from the request object (populated by JwtStrategy.validate()).
 *
 * @example
 * @Get('me')
 * getMe(@CurrentUser() user: UserDocument) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest<{ user: UserDocument }>();
    return request.user;
  },
);
