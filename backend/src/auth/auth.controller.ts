import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Accepts email + password, returns a JWT access token and public user data.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateCredentials(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.authService.login(user);
  }

  /**
   * GET /auth/me
   * Returns the currently authenticated user's public profile.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: UserDocument) {
    // toJSON() strips passwordHash and __v
    return user.toJSON();
  }
}
