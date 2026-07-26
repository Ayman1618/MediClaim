import {
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';

export interface UserPublicProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthTokenPayload {
  accessToken: string;
  user: UserPublicProfile;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate email/password credentials.
   * Returns null if credentials are invalid — caller must handle the 401.
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmailWithHash(email);
    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) return null;

    return user;
  }

  /**
   * Issue a JWT for a verified user.
   */
  async login(user: UserDocument): Promise<AuthTokenPayload> {
    const payload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    };

    // toJSON() strips passwordHash and __v from the user object
    const userJson = user.toJSON() as Record<string, unknown>;

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        _id: String(userJson['_id']),
        name: String(userJson['name']),
        email: String(userJson['email']),
        role: String(userJson['role']),
        createdAt: userJson['createdAt'] as Date | undefined,
        updatedAt: userJson['updatedAt'] as Date | undefined,
      },
    };
  }
}
