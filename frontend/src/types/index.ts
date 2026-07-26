/**
 * Shared TypeScript types for the MediClaim frontend.
 *
 * These mirror the backend response shapes. All monetary values
 * are in paise (integers). Use the formatCurrency() utility for display.
 */

// ─── Auth ──────────────────────────────────────────────────────────────────────

export type Role = 'PATIENT' | 'INSURER';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ─── Claims ────────────────────────────────────────────────────────────────────

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ActivityType =
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED';

export interface ActivityEntry {
  type: ActivityType;
  message: string;
  timestamp: string;
}

export interface DocumentMeta {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Claim {
  _id: string;
  claimId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  /** Claim amount in paise */
  claimAmount: number;
  description: string;
  documents: DocumentMeta[];
  status: ClaimStatus;
  /** Approved amount in paise. Null unless APPROVED. */
  approvedAmount: number | null;
  insurerComments: string | null;
  submittedAt: string;
  decidedAt: string | null;
  activity: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Insurer Stats ─────────────────────────────────────────────────────────────

export interface ClaimStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  /** Total requested amount in paise */
  totalRequestedAmount: number;
  /** Total approved amount in paise */
  totalApprovedAmount: number;
}

// ─── Forms ─────────────────────────────────────────────────────────────────────

export interface CreateClaimFormValues {
  description: string;
  /** Amount in INR (display) — converted to paise before API call */
  claimAmountInr: number;
  documentKeys?: string[];
}

export type DecisionAction = 'APPROVE' | 'REJECT';

export interface ClaimDecisionFormValues {
  action: DecisionAction;
  /** Amount in INR — converted to paise before API call */
  approvedAmountInr?: number;
  insurerComments?: string;
}
