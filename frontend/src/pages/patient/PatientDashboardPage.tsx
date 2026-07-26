import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { claimsService } from '@/services/claimsService';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricSkeleton, ClaimRowSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  FileText,
  Clock,
  CheckCircle2,
  IndianRupee,
  Plus,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: claims, isLoading, isError, error } = useQuery({
    queryKey: ['patient-claims'],
    queryFn: () => claimsService.getMyClaims(),
  });

  // Calculate real-time summary statistics
  const totalClaims = claims?.length || 0;
  const pendingClaims = claims?.filter((c) => c.status === 'PENDING').length || 0;
  const approvedClaims = claims?.filter((c) => c.status === 'APPROVED').length || 0;
  const rejectedClaims = claims?.filter((c) => c.status === 'REJECTED').length || 0;

  const totalApprovedPaise =
    claims
      ?.filter((c) => c.status === 'APPROVED')
      .reduce((sum, c) => sum + (c.approvedAmount || 0), 0) || 0;

  const recentClaims = claims?.slice(0, 5) || [];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Welcome Banner / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name?.split(' ')[0] || 'Patient'}
            </h1>
            <p className="text-sm text-slate-500">
              Here is the real-time status of your medical insurance claims.
            </p>
          </div>

          <Button
            onClick={() => navigate('/app/claims/new')}
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0"
          >
            Submit new claim
          </Button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Claims"
                value={totalClaims}
                subtitle="All submitted claims"
                icon={<FileText className="w-5 h-5 text-slate-600" />}
              />
              <MetricCard
                title="Pending Review"
                value={pendingClaims}
                subtitle="Awaiting insurer action"
                icon={<Clock className="w-5 h-5 text-amber-600" />}
              />
              <MetricCard
                title="Approved Claims"
                value={approvedClaims}
                subtitle={`${rejectedClaims} rejected`}
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              />
              <MetricCard
                title="Total Approved"
                value={formatCurrency(totalApprovedPaise)}
                subtitle="Reimbursed to date"
                variant="highlight"
                icon={<IndianRupee className="w-5 h-5 text-blue-400" />}
              />
            </>
          )}
        </div>

        {/* Claim Status Distribution Visual Bar (Lightweight CSS representation) */}
        {!isLoading && totalClaims > 0 && (
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="font-semibold uppercase tracking-wider text-slate-500">
                Claim Status Distribution
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Approved ({approvedClaims})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Pending ({pendingClaims})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Rejected ({rejectedClaims})
                </span>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {approvedClaims > 0 && (
                <div
                  style={{ width: `${(approvedClaims / totalClaims) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Approved: ${approvedClaims}`}
                />
              )}
              {pendingClaims > 0 && (
                <div
                  style={{ width: `${(pendingClaims / totalClaims) * 100}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Pending: ${pendingClaims}`}
                />
              )}
              {rejectedClaims > 0 && (
                <div
                  style={{ width: `${(rejectedClaims / totalClaims) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Rejected: ${rejectedClaims}`}
                />
              )}
            </div>
          </div>
        )}

        {/* Recent Claims Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Claims</h2>
              <p className="text-xs text-slate-500">Your latest healthcare claim submissions</p>
            </div>

            {totalClaims > 0 && (
              <Link
                to="/app/claims"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <span>View all claims ({totalClaims})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="divide-y divide-slate-100">
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-rose-600">
              Failed to load claims. {String(error)}
            </div>
          ) : totalClaims === 0 ? (
            <EmptyState
              title="No claims submitted yet"
              description="When you submit your medical reimbursement claims, you will be able to track their progress here."
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
          ) : (
            <div className="divide-y divide-slate-100">
              {recentClaims.map((claim) => (
                <div
                  key={claim.claimId}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {claim.claimId}
                      </span>
                      <StatusBadge status={claim.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">
                      {claim.description}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Submitted on {formatDate(claim.submittedAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500">Requested</div>
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(claim.claimAmount)}
                      </div>
                      {claim.status === 'APPROVED' && claim.approvedAmount != null && (
                        <div className="text-[11px] font-medium text-emerald-700">
                          Approved: {formatCurrency(claim.approvedAmount)}
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/app/claims/${claim.claimId}`}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View claim detail"
                    >
                      <ChevronRight className="w-5 h-5" />
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
