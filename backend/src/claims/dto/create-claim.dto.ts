import {
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

/**
 * DTO for submitting a new claim.
 *
 * Notes on amount:
 * - claimAmount is in paise (integer). 1 INR = 100 paise.
 * - The frontend must convert user-entered INR values to paise before sending.
 * - Example: ₹1,250.00 → 125000
 *
 * Patient identity (name, email, patientId) is derived from the JWT
 * and NOT accepted from the request body to prevent identity spoofing.
 */
export class CreateClaimDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  description!: string;

  /**
   * Claim amount in paise. Must be a positive integer.
   * Minimum: 1 paise (though realistically validated higher at the UI layer).
   */
  @IsInt({ message: 'claimAmount must be a whole number in paise.' })
  @Min(1, { message: 'Claim amount must be greater than zero.' })
  claimAmount!: number;

  /**
   * Optional array of stored document filenames (UUIDs returned by UploadsModule).
   * Documents must have been previously uploaded before claim submission.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  documentKeys?: string[];
}
