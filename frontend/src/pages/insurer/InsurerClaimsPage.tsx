import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { claimsService } from '@/services/claimsService';
import { formatCurrency, formatDate, inrToPaise } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClaimRowSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  SlidersHorizontal,
} from 'lucide-react';

export default function InsurerClaimsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const statusParam = searchParams.get('status') || 'ALL';
  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [showMoreFilters, setShowMoreFilters] = useState<boolean>(false);

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [minInr, setMinInr] = useState<string>('');
  const [maxInr, setMaxInr] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Sync status URL param
  useEffect(() => {
    if (statusParam !== statusFilter) {
      setStatusFilter(statusParam);
    }
  }, [statusParam]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page to 1 when filters change
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    if (newStatus === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', newStatus);
    }
    setSearchParams(searchParams);
  };

  // Build query payload for backend GET /claims
  const queryParams = {
    page,
    limit,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    search: debouncedSearch.trim() || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    minAmount: minInr ? inrToPaise(parseFloat(minInr)) : undefined,
    maxAmount: maxInr ? inrToPaise(parseFloat(maxInr)) : undefined,
  };

  // Server-side query via TanStack Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['insurer-claims-list', queryParams],
    queryFn: () => claimsService.getAllClaims(queryParams),
  });

  const claims = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    Boolean(debouncedSearch) ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    Boolean(minInr) ||
    Boolean(maxInr);

  const clearAllFilters = () => {
    setStatusFilter('ALL');
    setSearchInput('');
    setDebouncedSearch('');
    setFromDate('');
    setToDate('');
    setMinInr('');
    setMaxInr('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Claims Management"
          description="Search, filter, and inspect all patient reimbursement claims across the platform."
        />

        {/* Primary Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => {
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All Claims'
                      : st === 'PENDING'
                      ? 'Pending Review'
                      : st === 'APPROVED'
                      ? 'Approved'
                      : 'Rejected'}
                  </button>
                );
              })}
            </div>

            {/* Search Bar & Filter Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search claim ID, patient or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                variant={showMoreFilters || fromDate || toDate || minInr || maxInr ? 'primary' : 'outline'}
                size="sm"
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Expandable Advanced Filters Panel */}
          {showMoreFilters && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Submitted From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Submitted To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Min Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={minInr}
                  onChange={(e) => {
                    setMinInr(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Max Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={maxInr}
                  onChange={(e) => {
                    setMaxInr(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filters & Counter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1">
          <div>
            Showing <span className="font-semibold text-slate-900">{claims.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{total}</span> total claims
            {hasActiveFilters && ' (filtered)'}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-slate-700 hover:text-slate-900 font-medium underline inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Claims Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-slate-100">
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-rose-600">
              Failed to load claims. {String(error)}
            </div>
          ) : claims.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? 'No claims match these filters' : 'No claims submitted'}
              description={
                hasActiveFilters
                  ? 'Try adjusting your search query, status filter, date range, or amount parameters.'
                  : 'No medical reimbursement claims have been submitted by patients yet.'
              }
              action={
                hasActiveFilters ? (
                  <Button onClick={clearAllFilters} variant="outline" size="sm">
                    Clear all filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              {/* Desktop Dense Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Claim ID</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Submitted Date</th>
                      <th className="py-3 px-4 text-right">Requested</th>
                      <th className="py-3 px-4 text-right">Approved</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {claims.map((claim) => {
                      const isPending = claim.status === 'PENDING';
                      return (
                        <tr
                          key={claim.claimId}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {claim.claimId}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{claim.patientName}</div>
                            <div className="text-[11px] text-slate-400">{claim.patientEmail}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {formatDate(claim.submittedAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatCurrency(claim.claimAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                            {claim.status === 'APPROVED' && claim.approvedAmount != null
                              ? formatCurrency(claim.approvedAmount)
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <StatusBadge status={claim.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/insurer/claims/${claim.claimId}`}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                isPending
                                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <span>{isPending ? 'Review' : 'View'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Layout */}
              <div className="md:hidden divide-y divide-slate-100">
                {claims.map((claim) => {
                  const isPending = claim.status === 'PENDING';
                  return (
                    <div key={claim.claimId} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {claim.claimId}
                        </span>
                        <StatusBadge status={claim.status} size="sm" />
                      </div>

                      <div className="space-y-0.5 text-xs">
                        <div className="font-semibold text-slate-900">{claim.patientName}</div>
                        <div className="text-slate-400">{claim.patientEmail}</div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Requested</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(claim.claimAmount)}
                          </span>
                        </div>

                        {claim.status === 'APPROVED' && claim.approvedAmount != null && (
                          <div>
                            <span className="text-slate-400 block text-[10px]">Approved</span>
                            <span className="font-bold text-emerald-700">
                              {formatCurrency(claim.approvedAmount)}
                            </span>
                          </div>
                        )}

                        <Link
                          to={`/insurer/claims/${claim.claimId}`}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            isPending
                              ? 'bg-slate-900 text-white hover:bg-slate-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{isPending ? 'Review' : 'View'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <div>
                Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>

                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
