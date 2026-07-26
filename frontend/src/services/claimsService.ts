/**
 * Claims service — all claim-related API calls.
 */
import { apiClient } from '@/lib/apiClient';
import type {
  Claim,
  ClaimStats,
  PaginatedResponse,
} from '@/types';

export interface CreateClaimPayload {
  description: string;
  /** Amount in paise */
  claimAmount: number;
  documentKeys?: string[];
}

export interface ClaimsQueryParams {
  status?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClaimDecisionPayload {
  action: 'APPROVE' | 'REJECT';
  /** Amount in paise — required when action = APPROVE */
  approvedAmount?: number;
  insurerComments?: string;
}

export const claimsService = {
  // ── Patient ──────────────────────────────────────────────────────────────────

  async createClaim(payload: CreateClaimPayload): Promise<Claim> {
    const { data } = await apiClient.post<Claim>('/claims', payload);
    return data;
  },

  async getMyClaims(): Promise<Claim[]> {
    const { data } = await apiClient.get<Claim[]>('/claims/my');
    return data;
  },

  async getClaimById(claimId: string): Promise<Claim> {
    const { data } = await apiClient.get<Claim>(`/claims/${claimId}`);
    return data;
  },

  // ── Insurer ──────────────────────────────────────────────────────────────────

  async getAllClaims(params?: ClaimsQueryParams): Promise<PaginatedResponse<Claim>> {
    const { data } = await apiClient.get<PaginatedResponse<Claim>>('/claims', { params });
    return data;
  },

  async getStats(): Promise<ClaimStats> {
    const { data } = await apiClient.get<ClaimStats>('/claims/stats');
    return data;
  },

  async makeDecision(claimId: string, payload: ClaimDecisionPayload): Promise<Claim> {
    const { data } = await apiClient.patch<Claim>(
      `/claims/${claimId}/decision`,
      payload,
    );
    return data;
  },
};
