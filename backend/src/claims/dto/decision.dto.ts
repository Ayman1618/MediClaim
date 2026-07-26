import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  MinLength,
} from 'class-validator';

export enum DecisionAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

/**
 * DTO for the insurer claim decision endpoint.
 *
 * APPROVE:
 *   - approvedAmount is required, must be positive, validated <= claimAmount in service
 *   - insurerComments are optional
 *
 * REJECT:
 *   - insurerComments is required (rejection reason)
 *   - approvedAmount is not accepted
 */
export class ClaimDecisionDto {
  @IsEnum(DecisionAction)
  action!: DecisionAction;

  /**
   * Approved amount in paise. Required when action = APPROVE.
   * Cross-field validation (cannot exceed claimAmount) is performed in ClaimsService.
   */
  @ValidateIf((o: ClaimDecisionDto) => o.action === DecisionAction.APPROVE)
  @IsInt({ message: 'approvedAmount must be a whole number in paise.' })
  @Min(1, { message: 'Approved amount must be at least 1 paise.' })
  approvedAmount?: number;

  /**
   * Required when action = REJECT (rejection reason).
   * Optional when action = APPROVE.
   */
  @ValidateIf((o: ClaimDecisionDto) => o.action === DecisionAction.REJECT)
  @IsString()
  @MinLength(5, { message: 'Please provide a meaningful rejection reason (min 5 characters).' })
  insurerComments?: string;
}
