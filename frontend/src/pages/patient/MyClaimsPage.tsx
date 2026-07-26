import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { claimsService } from '@/services/claimsService';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClaimRowSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  Search,
  Plus,
  ChevronRight,
  X,
} from 'lucide-react';

export default function MyClaimsPage() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: claims, isLoading, isError, error } = useQuery({
    queryKey: ['patient-claims'],
    queryFn: () => claimsService.getMyClaims(),
  });

  // Client-side filtering & search
  const filteredClaims = useMemo(() => {
    if (!claims) return [];
    return claims.filter((claim) => {
      // Status filter
      if (selectedStatus !== 'ALL' && claim.status !== selectedStatus) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = claim.claimId.toLowerCase().includes(query);
        const matchesDesc = claim.description.toLowerCase().includes(query);
        if (!matchesId && !matchesDesc) return false;
      }
      return true;
    });
  }, [claims, selectedStatus, searchQuery]);

  const hasActiveFilters = selectedStatus !== 'ALL' || searchQuery.trim() !== '';

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="My Claims"
          description="View and track all your medical insurance reimbursement claims."
          action={
            <Button
              onClick={() => navigate('/app/claims/new')}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Submit new claim
            </Button>
          }
        />

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => {
              const isActive = selectedStatus === status;
              const count =
                status === 'ALL'
                  ? claims?.length || 0
                  : claims?.filter((c) => c.status === status).length || 0;

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>
                    {status === 'ALL'
                      ? 'All Claims'
                      : status === 'PENDING'
                      ? 'Pending'
                      : status === 'APPROVED'
                      ? 'Approved'
                      : 'Rejected'}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search claim ID or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results Counter & Clear Filter indicator */}
        {hasActiveFilters && claims && claims.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing {filteredClaims.length} of {claims.length} claims
            </span>
            <button
              onClick={() => {
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="text-slate-700 hover:underline font-medium"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Claims List Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-slate-100">
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-rose-600">
              Failed to load claims. {String(error)}
            </div>
          ) : claims?.length === 0 ? (
            <EmptyState
              title="No claims submitted yet"
              description="You have not submitted any medical reimbursement claims."
              action={
                <Button
                  onClick={() => navigate('/app/claims/new')}
                  variant="primary"
                  size="md"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Submit your first claim
                </Button>
              }
            />
          ) : filteredClaims.length === 0 ? (
            <EmptyState
              title="No matching claims found"
              description="No claims matched your current filter or search criteria."
              action={
                <Button
                  onClick={() => {
                    setSelectedStatus('ALL');
                    setSearchQuery('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear search and filters
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredClaims.map((claim) => (
                <div
                  key={claim.claimId}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {claim.claimId}
                      </span>
                      <StatusBadge status={claim.status} size="sm" />
                      <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                      <span className="text-xs text-slate-500 hidden sm:inline">
                        Submitted {formatDate(claim.submittedAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                      {claim.description}
                    </p>

                    <p className="text-[11px] text-slate-400 sm:hidden">
                      Submitted on {formatDate(claim.submittedAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500">Requested</div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(claim.claimAmount, { omitZeroPaise: true })}
                      </div>
                      {claim.status === 'APPROVED' && claim.approvedAmount != null && (
                        <div className="text-[11px] font-semibold text-emerald-700">
                          Approved: {formatCurrency(claim.approvedAmount, { omitZeroPaise: true })}
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/app/claims/${claim.claimId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
