/**
 * Audit/activity event types that can appear in a claim's activity history.
 *
 * Only events that actually occurred are ever stored.
 * No synthetic or speculative events are created.
 */
export enum ActivityType {
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
}
