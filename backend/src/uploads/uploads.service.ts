import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { DocumentMeta, Claim, ClaimDocument } from '../claims/schemas/claim.schema';
import { UploadMetadata, UploadMetadataDocument } from './schemas/upload-metadata.schema';

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(UploadMetadata.name)
    private readonly uploadMetadataModel: Model<UploadMetadataDocument>,
    @InjectModel(Claim.name)
    private readonly claimModel: Model<ClaimDocument>,
  ) {
    const dir = this.configService.get<string>('uploads.directory') ?? './uploads';
    // Resolve relative to the process working directory (project root)
    this.uploadDir = path.resolve(process.cwd(), dir);

    // Ensure the upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Store metadata for an uploaded file in MongoDB.
   * Called by the uploads controller after Multer writes the file.
   */
  async storeMetadata(meta: DocumentMeta): Promise<DocumentMeta> {
    const record = await this.uploadMetadataModel.findOneAndUpdate(
      { storedName: meta.storedName },
      meta,
      { upsert: true, new: true },
    );
    return {
      originalName: record.originalName,
      storedName: record.storedName,
      mimeType: record.mimeType,
      size: record.size,
      uploadedAt: record.uploadedAt,
    };
  }

  /**
   * Retrieve metadata for a stored file by its stored filename.
   * Checks UploadMetadata first, falls back to Claim.documents.
   */
  async getMetadata(storedName: string): Promise<DocumentMeta | null> {
    const record = await this.uploadMetadataModel.findOne({ storedName }).exec();
    if (record) {
      return {
        originalName: record.originalName,
        storedName: record.storedName,
        mimeType: record.mimeType,
        size: record.size,
        uploadedAt: record.uploadedAt,
      };
    }

    // Fallback: Check if metadata is embedded in an existing claim's document array
    const claim = await this.claimModel
      .findOne({ 'documents.storedName': storedName }, { 'documents.$': 1 })
      .exec();

    if (claim && claim.documents && claim.documents.length > 0) {
      const doc = claim.documents[0];
      return {
        originalName: doc.originalName,
        storedName: doc.storedName,
        mimeType: doc.mimeType,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
      };
    }

    return null;
  }

  /**
   * Resolve an array of document keys to their DocumentMeta objects.
   * Used by ClaimsService when attaching documents to a claim.
   */
  async resolveDocumentMetas(keys: string[]): Promise<DocumentMeta[]> {
    if (!keys || keys.length === 0) return [];

    const records = await this.uploadMetadataModel
      .find({ storedName: { $in: keys } })
      .exec();

    const metaMap = new Map<string, DocumentMeta>();
    for (const r of records) {
      metaMap.set(r.storedName, {
        originalName: r.originalName,
        storedName: r.storedName,
        mimeType: r.mimeType,
        size: r.size,
        uploadedAt: r.uploadedAt,
      });
    }

    const resolved: DocumentMeta[] = [];
    for (const key of keys) {
      const meta = metaMap.get(key);
      if (meta) {
        resolved.push(meta);
      }
    }
    return resolved;
  }

  /**
   * Get the absolute filesystem path for a stored file.
   * Path traversal is prevented by using only the basename of the stored filename.
   */
  getFilePath(storedName: string): string {
    const safeName = path.basename(storedName);
    return path.join(this.uploadDir, safeName);
  }

  /**
   * Verify that the requesting user is allowed to access the given file.
   */
  verifyFileAccess(
    storedName: string,
    requestingUser: UserDocument,
    claimPatientId?: string,
  ): void {
    if (requestingUser.role === Role.INSURER) {
      return; // Insurers have unrestricted document access
    }

    if (!claimPatientId) {
      throw new ForbiddenException('File access denied.');
    }

    const userId = (requestingUser._id as { toString(): string }).toString();
    if (claimPatientId !== userId) {
      throw new ForbiddenException('You do not have access to this document.');
    }
  }

  /**
   * Check that the file exists on disk.
   */
  ensureFileExists(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk.');
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }
}
