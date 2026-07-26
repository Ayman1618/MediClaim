import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClaimsModule } from './claims/claims.module';
import { UploadsModule } from './uploads/uploads.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Load and validate environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // MongoDB connection — URI from configuration
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    ClaimsModule,
    UploadsModule,
  ],
})
export class AppModule {}
