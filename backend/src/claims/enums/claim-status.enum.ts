/**
 * Claim lifecycle status values.
 *
 * PENDING  — submitted, awaiting insurer review
 * APPROVED — insurer approved, with an approved amount
 * REJECTED — insurer rejected, with a required rejection reason
 */
export enum ClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
