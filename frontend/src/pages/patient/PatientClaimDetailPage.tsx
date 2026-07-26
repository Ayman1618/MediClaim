import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimsService } from '@/services/claimsService';
import { uploadsService } from '@/services/uploadsService';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ClaimDetailSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  FileCheck,
} from 'lucide-react';

export default function PatientClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();

  const { data: claim, isLoading, isError } = useQuery({
    queryKey: ['claim-detail', claimId],
    queryFn: () => claimsService.getClaimById(claimId!),
    enabled: Boolean(claimId),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-6">
          <ClaimDetailSkeleton />
        </div>
      </AppShell>
    );
  }

  if (isError || !claim) {
    return (
      <AppShell>
        <div className="py-12 max-w-lg mx-auto text-center space-y-4">
          <EmptyState
            title="Claim Not Found"
            description={`We could not locate claim reference '${claimId}'. It may not exist or you may not have authorization to view it.`}
            action={
              <Button
                onClick={() => navigate('/app/claims')}
                variant="primary"
                size="md"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to My Claims
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const isApproved = claim.status === 'APPROVED';
  const isRejected = claim.status === 'REJECTED';
  const isPending = claim.status === 'PENDING';

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/claims"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Claims</span>
          </Link>

          <span className="font-mono text-xs font-semibold text-slate-400">
            Reference: {claim.claimId}
          </span>
        </div>

        {/* Claim Header Summary Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                  {claim.claimId}
                </h1>
                <StatusBadge status={claim.status} size="md" />
              </div>
              <p className="text-xs text-slate-500">
                Submitted on {formatDateTime(claim.submittedAt)}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Requested Amount
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(claim.claimAmount, { omitZeroPaise: true })}
              </span>
            </div>
          </div>

          {/* Decision Status Specific View Banner */}
          {isApproved && (
            <div className="p-5 bg-emerald-50/90 rounded-xl border border-emerald-200 text-emerald-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Claim Approved</span>
                </div>
                {claim.decidedAt && (
                  <span className="text-xs text-emerald-700 font-medium">
                    Decided on {formatDate(claim.decidedAt)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-200/60">
                <div>
                  <span className="text-xs text-emerald-700 font-medium block">
                    Approved Amount
                  </span>
                  <span className="text-xl font-bold text-emerald-900">
                    {formatCurrency(claim.approvedAmount, { omitZeroPaise: true })}
                  </span>
                </div>
                {claim.insurerComments && (
                  <div>
                    <span className="text-xs text-emerald-700 font-medium block">
                      Insurer Comments / Notes
                    </span>
                    <p className="text-xs text-emerald-950 mt-0.5 leading-relaxed">
                      "{claim.insurerComments}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isRejected && (
            <div className="p-5 bg-rose-50/90 rounded-xl border border-rose-200 text-rose-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Claim Rejected</span>
                </div>
                {claim.decidedAt && (
                  <span className="text-xs text-rose-700 font-medium">
                    Decided on {formatDate(claim.decidedAt)}
                  </span>
                )}
              </div>

              {claim.insurerComments && (
                <div className="pt-2 border-t border-rose-200/60">
                  <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block">
                    Rejection Reason
                  </span>
                  <p className="text-xs text-rose-950 mt-1 leading-relaxed bg-white/60 p-3 rounded-lg border border-rose-200/50">
                    "{claim.insurerComments}"
                  </p>
                </div>
              )}
            </div>
          )}

          {isPending && (
            <Alert type="warning" title="Under Insurer Review">
              Your claim is currently being evaluated by the claims team. You will see the approved amount and comments here once a decision is finalised.
            </Alert>
          )}

          {/* Claim Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Claim Description
              </h3>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60 whitespace-pre-line">
                {claim.description}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Patient & Policy Information
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Patient Name</span>
                  <span className="font-semibold text-slate-900">{claim.patientName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Patient Email</span>
                  <span className="font-medium text-slate-900">{claim.patientEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Submitted Date</span>
                  <span className="font-medium text-slate-900">
                    {formatDate(claim.submittedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Documents Section */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Supporting Documents</h2>
          <p className="text-xs text-slate-500">
            Medical bills, discharge summaries, or diagnostic reports attached to this claim.
          </p>

          {claim.documents && claim.documents.length > 0 ? (
            <div className="space-y-3 pt-2">
              {claim.documents.map((doc, idx) => (
                <div
                  key={doc.storedName || idx}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {doc.mimeType} • {(doc.size / 1024).toFixed(1)} KB • Uploaded{' '}
                        {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={uploadsService.getDocumentUrl(doc.storedName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Document</span>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center">
              No supporting documents attached to this claim.
            </div>
          )}
        </div>

        {/* Claim Activity Timeline */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Claim Activity Timeline</h2>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {claim.activity && claim.activity.length > 0 ? (
              claim.activity.map((event, idx) => {
                const isApprove = event.type === 'CLAIM_APPROVED';
                const isReject = event.type === 'CLAIM_REJECTED';

                return (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white ${
                        isApprove
                          ? 'bg-emerald-500'
                          : isReject
                          ? 'bg-rose-500'
                          : 'bg-slate-900'
                      }`}
                    >
                      {isApprove ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isReject ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          {event.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                        {event.message}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500">No activity recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
