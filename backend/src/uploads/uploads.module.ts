import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { Claim, ClaimSchema } from '../claims/schemas/claim.schema';
import { UploadMetadata, UploadMetadataSchema } from './schemas/upload-metadata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Claim.name, schema: ClaimSchema },
      { name: UploadMetadata.name, schema: UploadMetadataSchema },
    ]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uploadDir = path.resolve(
          process.cwd(),
          configService.get<string>('uploads.directory') ?? './uploads',
        );

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Expose the resolved path for the controller's diskStorage config
        process.env.RESOLVED_UPLOAD_DIR = uploadDir;

        return {
          storage: diskStorage({
            destination: (_req, _file, cb) => cb(null, uploadDir),
            filename: (_req, file, cb) => {
              const ext = path.extname(file.originalname).toLowerCase();
              cb(null, `${uuidv4()}${ext}`);
            },
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
