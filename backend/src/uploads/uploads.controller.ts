import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Claim, ClaimDocument } from '../claims/schemas/claim.schema';
import { Model } from 'mongoose';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    @InjectModel(Claim.name) private readonly claimModel: Model<ClaimDocument>,
  ) {}

  /**
   * POST /uploads
   * Upload a supporting document. Patient role only.
   *
   * Returns the stored filename (UUID-based) which the patient includes
   * in the subsequent POST /claims request.
   */
  @Post()
  @Roles(Role.PATIENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          // The destination is resolved at runtime from UploadsService.
          // We use a temporary approach here; see UploadsModule for the full setup.
          cb(null, process.env.RESOLVED_UPLOAD_DIR ?? './uploads');
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          const storedName = `${uuidv4()}${ext}`;
          cb(null, storedName);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              `Invalid file type. Allowed: PDF, JPEG, PNG. Received: ${file.mimetype}`,
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const meta = {
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    this.uploadsService.storeMetadata(meta);

    return {
      storedName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * GET /uploads/file/:filename
   * Serve a stored document file.
   *
   * Access control:
   * - Insurers: unrestricted
   * - Patients: only if the file belongs to one of their claims
   */
  @Get('file/:filename')
  async serveFile(
    @Param('filename') filename: string,
    @CurrentUser() user: UserDocument,
    @Res() res: Response,
  ) {
    // Sanitise filename — prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = this.uploadsService.getFilePath(safeFilename);

    this.uploadsService.ensureFileExists(filePath);

    // For patients, verify file belongs to one of their claims
    if (user.role === Role.PATIENT) {
      const claim = await this.claimModel.findOne({
        patientId: user._id,
        'documents.storedName': safeFilename,
      });

      if (!claim) {
        throw new NotFoundException('File not found or access denied.');
      }
    }

    // Look up MIME type from metadata store, fall back to octet-stream
    const meta = this.uploadsService.getMetadata(safeFilename);
    const contentType = meta?.mimeType ?? 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${meta?.originalName ?? safeFilename}"`,
    );
    res.sendFile(filePath);
  }
}
