import {
  IsOptional,
  IsEnum,
  IsInt,
  IsString,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimStatus } from '../enums/claim-status.enum';

/**
 * Query DTO for the insurer claim listing endpoint.
 *
 * All fields are optional. Multiple filters compose with AND logic.
 * Server-side filtering via MongoDB query — not in-memory.
 */
export class QueryClaimsDto {
  /** Filter by claim status */
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  /** Filter: claims submitted on or after this date (ISO 8601) */
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  /** Filter: claims submitted on or before this date (ISO 8601) */
  @IsOptional()
  @IsDateString()
  toDate?: string;

  /** Filter: minimum claim amount in paise */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minAmount?: number;

  /** Filter: maximum claim amount in paise */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxAmount?: number;

  /**
   * Full-text search across claimId, patientName, patientEmail.
   * Implemented as a case-insensitive regex on indexed fields.
   */
  @IsOptional()
  @IsString()
  search?: string;

  /** Page number, 1-indexed */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  /** Results per page (default 20, max 100) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
