import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    });
  }

  /**
   * Called by Passport after a valid JWT is verified.
   * Loads the full user document from the database so that controller
   * handlers receive a live, authoritative user object — not just token claims.
   */
  async validate(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      // Guard will translate this into a 401
      throw new Error('User not found');
    }
    return user;
  }
}
