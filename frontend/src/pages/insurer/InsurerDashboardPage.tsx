import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { claimsService } from '@/services/claimsService';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MetricSkeleton, ClaimRowSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  ArrowRight,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';

export default function InsurerDashboardPage() {
  const navigate = useNavigate();

  // Fetch insurer aggregated statistics
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['insurer-stats'],
    queryFn: () => claimsService.getStats(),
  });

  // Fetch pending claims requiring review
  const { data: pendingClaimsData, isLoading: isPendingLoading } = useQuery({
    queryKey: ['insurer-pending-claims'],
    queryFn: () => claimsService.getAllClaims({ status: 'PENDING', limit: 5 }),
  });

  const pendingClaims = pendingClaimsData?.data || [];
  const totalClaims = stats?.total || 0;
  const pendingCount = stats?.pending || 0;
  const approvedCount = stats?.approved || 0;
  const rejectedCount = stats?.rejected || 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Claims overview"
          description="Review submitted claims and manage reimbursement decisions."
          action={
            <Button
              onClick={() => navigate('/insurer/claims')}
              variant="outline"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Browse all claims
            </Button>
          }
        />

        {/* Insurer Operational Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isStatsLoading ? (
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
                subtitle="Total submitted across platform"
                icon={<FileText className="w-5 h-5 text-slate-600" />}
              />
              <MetricCard
                title="Pending Review"
                value={pendingCount}
                subtitle="Requires insurer decision"
                icon={<Clock className="w-5 h-5 text-amber-600" />}
              />
              <MetricCard
                title="Approved Claims"
                value={approvedCount}
                subtitle="Approved for reimbursement"
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              />
              <MetricCard
                title="Rejected Claims"
                value={rejectedCount}
                subtitle="Declined with reason"
                icon={<XCircle className="w-5 h-5 text-rose-600" />}
              />
            </>
          )}
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isStatsLoading ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Requested Amount"
                value={formatCurrency(stats?.totalRequestedAmount, { omitZeroPaise: true })}
                subtitle="Cumulative claimed medical expenses"
                icon={<IndianRupee className="w-5 h-5 text-slate-600" />}
              />
              <MetricCard
                title="Total Approved Amount"
                value={formatCurrency(stats?.totalApprovedAmount, { omitZeroPaise: true })}
                subtitle="Cumulative approved reimbursements"
                variant="highlight"
                icon={<IndianRupee className="w-5 h-5 text-blue-400" />}
              />
            </>
          )}
        </div>

        {/* Claim Workload Distribution Visual Bar */}
        {!isStatsLoading && totalClaims > 0 && (
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="font-semibold uppercase tracking-wider text-slate-500">
                Workload Distribution
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Pending ({pendingCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Approved ({approvedCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Rejected ({rejectedCount})
                </span>
              </div>
            </div>

            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {pendingCount > 0 && (
                <div
                  style={{ width: `${(pendingCount / totalClaims) * 100}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Pending: ${pendingCount}`}
                />
              )}
              {approvedCount > 0 && (
                <div
                  style={{ width: `${(approvedCount / totalClaims) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Approved: ${approvedCount}`}
                />
              )}
              {rejectedCount > 0 && (
                <div
                  style={{ width: `${(rejectedCount / totalClaims) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Rejected: ${rejectedCount}`}
                />
              )}
            </div>
          </div>
        )}

        {/* Needs Review Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Needs Review</h2>
              <p className="text-xs text-slate-500">
                Pending claims awaiting insurer approval or rejection
              </p>
            </div>

            <Link
              to="/insurer/claims?status=PENDING"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>View all pending ({pendingCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isPendingLoading ? (
            <div className="divide-y divide-slate-100">
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
              <ClaimRowSkeleton />
            </div>
          ) : pendingClaims.length === 0 ? (
            <EmptyState
              icon={<CheckCheck className="w-10 h-10 text-emerald-500" />}
              title="You're all caught up"
              description="No claims are currently awaiting review."
              action={
                <Button
                  onClick={() => navigate('/insurer/claims')}
                  variant="outline"
                  size="sm"
                >
                  View all processed claims
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingClaims.map((claim) => (
                <div
                  key={claim.claimId}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {claim.claimId}
                      </span>
                      <StatusBadge status={claim.status} size="sm" />
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {claim.patientName}
                      </span>
                      <span className="text-xs text-slate-400">({claim.patientEmail})</span>
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
                        {formatCurrency(claim.claimAmount, { omitZeroPaise: true })}
                      </div>
                    </div>

                    <Link
                      to={`/insurer/claims/${claim.claimId}`}
                      className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
                    >
                      <span>Review</span>
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
