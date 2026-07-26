import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import { DocumentMeta } from '../claims/schemas/claim.schema';

// In-memory store of uploaded file metadata keyed by storedName (UUID).
// In a real system this would be a database table or S3 object tags.
// Isolated here so the storage backend can be swapped without touching business logic.
const uploadStore = new Map<string, DocumentMeta>();

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    const dir = this.configService.get<string>('uploads.directory') ?? './uploads';
    // Resolve relative to the process working directory (project root)
    this.uploadDir = path.resolve(process.cwd(), dir);

    // Ensure the upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Store metadata for an uploaded file.
   * Called by the uploads controller after Multer writes the file.
   */
  storeMetadata(meta: DocumentMeta): void {
    uploadStore.set(meta.storedName, meta);
  }

  /**
   * Retrieve metadata for a stored file by its stored filename.
   * Returns null if not found.
   */
  getMetadata(storedName: string): DocumentMeta | null {
    return uploadStore.get(storedName) ?? null;
  }

  /**
   * Resolve an array of document keys to their DocumentMeta objects.
   * Used by ClaimsService when attaching documents to a claim.
   * Unknown keys are silently ignored (document may have been uploaded
   * in a separate session — this is an acceptable simplification for MVP).
   */
  async resolveDocumentMetas(keys: string[]): Promise<DocumentMeta[]> {
    return keys
      .map((key) => uploadStore.get(key))
      .filter((meta): meta is DocumentMeta => meta !== undefined);
  }

  /**
   * Get the absolute filesystem path for a stored file.
   * Path traversal is prevented by using only the basename of the stored filename.
   */
  getFilePath(storedName: string): string {
    // Sanitise: use only the basename to prevent path traversal
    const safeName = path.basename(storedName);
    return path.join(this.uploadDir, safeName);
  }

  /**
   * Verify that the requesting user is allowed to access the given file.
   *
   * Access rules:
   * - Insurers can access any file.
   * - Patients can only access files attached to their own claims.
   *   (Claim ownership check delegated to ClaimsService — here we check
   *    by passing the patientId of the claim's owner.)
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
   * Throws NotFoundException if absent.
   */
  ensureFileExists(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found.');
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }
}
