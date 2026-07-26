import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { claimsService } from '@/services/claimsService';
import { uploadsService } from '@/services/uploadsService';
import { formatCurrency, formatDate, formatDateTime, inrToPaise } from '@/lib/formatters';
import { getApiErrorMessage } from '@/lib/apiClient';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { ClaimDetailSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  History,
  FileCheck,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

export default function InsurerClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch claim details
  const { data: claim, isLoading, isError } = useQuery({
    queryKey: ['claim-detail', claimId],
    queryFn: () => claimsService.getClaimById(claimId!),
    enabled: Boolean(claimId),
  });

  // Decision form state
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvedAmountInr, setApprovedAmountInr] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

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
            description={`We could not locate claim reference '${claimId}'.`}
            action={
              <Button
                onClick={() => navigate('/insurer/claims')}
                variant="primary"
                size="md"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Claims List
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const isPending = claim.status === 'PENDING';
  const isApproved = claim.status === 'APPROVED';
  const isRejected = claim.status === 'REJECTED';
  const requestedInr = claim.claimAmount / 100;

  // Prefill approved amount with requested amount if empty when selecting APPROVE
  const handleSelectApprove = () => {
    setDecisionAction('APPROVE');
    setFormError(null);
    if (!approvedAmountInr) {
      setApprovedAmountInr(String(requestedInr));
    }
  };

  const handleSelectReject = () => {
    setDecisionAction('REJECT');
    setFormError(null);
  };

  const handleValidateForm = () => {
    setFormError(null);

    if (decisionAction === 'APPROVE') {
      const parsedAmount = parseFloat(approvedAmountInr);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setFormError('Please enter a valid approved amount greater than zero.');
        return false;
      }
      if (parsedAmount > requestedInr) {
        setFormError(
          `Approved amount (${formatCurrency(inrToPaise(parsedAmount))}) cannot exceed the requested claim amount (${formatCurrency(claim.claimAmount)}).`,
        );
        return false;
      }
    } else {
      // REJECT validation
      if (!comments.trim() || comments.trim().length < 5) {
        setFormError('Please provide a meaningful rejection reason (at least 5 characters).');
        return false;
      }
    }

    setShowConfirmModal(true);
    return true;
  };

  const handleExecuteDecision = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (decisionAction === 'APPROVE') {
        const paise = inrToPaise(parseFloat(approvedAmountInr));
        await claimsService.makeDecision(claim.claimId, {
          action: 'APPROVE',
          approvedAmount: paise,
          insurerComments: comments.trim() || undefined,
        });
      } else {
        await claimsService.makeDecision(claim.claimId, {
          action: 'REJECT',
          insurerComments: comments.trim(),
        });
      }

      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['claim-detail', claimId] }),
        queryClient.invalidateQueries({ queryKey: ['insurer-claims-list'] }),
        queryClient.invalidateQueries({ queryKey: ['insurer-pending-claims'] }),
        queryClient.invalidateQueries({ queryKey: ['insurer-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['patient-claims'] }),
      ]);
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navigation & Ref */}
        <div className="flex items-center justify-between">
          <Link
            to="/insurer/claims"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Claims</span>
          </Link>

          <span className="font-mono text-xs font-semibold text-slate-400">
            Reference: {claim.claimId}
          </span>
        </div>

        {/* Claim Overview Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {claim.claimId}
              </h1>
              <StatusBadge status={claim.status} size="md" />
            </div>
            <p className="text-xs text-slate-500">
              Submitted by <span className="font-semibold text-slate-900">{claim.patientName}</span> ({claim.patientEmail}) on {formatDate(claim.submittedAt)}
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

        {/* Desktop Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Claim Evidence, Description, Documents, Timeline (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Treatment Description */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Claim Treatment Description
              </h2>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60 whitespace-pre-line">
                {claim.description}
              </p>
            </div>

            {/* Supporting Documents */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Supporting Evidence & Documents
              </h2>

              {claim.documents && claim.documents.length > 0 ? (
                <div className="space-y-3">
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
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors shrink-0"
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

            {/* Claim Activity History Timeline */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Activity Trail
                </h2>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {claim.activity && claim.activity.length > 0 ? (
                  claim.activity.map((event, idx) => {
                    const isApprove = event.type === 'CLAIM_APPROVED';
                    const isReject = event.type === 'CLAIM_REJECTED';

                    return (
                      <div key={idx} className="relative">
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
                  <div className="text-xs text-slate-500">No activity recorded.</div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Decision Panel Workspace (5 cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            {isPending ? (
              /* PENDING CLAIM — DECISION FORM WORKSPACE */
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Insurer Decision Workspace</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review evidence and record an official approval or rejection decision.
                  </p>
                </div>

                {formError && <Alert type="error">{formError}</Alert>}

                {/* Decision Type Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={handleSelectApprove}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      decisionAction === 'APPROVE'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Claim</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectReject}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      decisionAction === 'REJECT'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Claim</span>
                  </button>
                </div>

                {/* APPROVE FORM */}
                {decisionAction === 'APPROVE' && (
                  <div className="space-y-4 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Requested Amount:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(claim.claimAmount)}
                      </span>
                    </div>

                    <Input
                      label="Approved Reimbursement Amount (₹)"
                      type="number"
                      step="0.01"
                      placeholder={`e.g. ${requestedInr}`}
                      leftAddon={<IndianRupee className="w-4 h-4 text-slate-400" />}
                      value={approvedAmountInr}
                      onChange={(e) => setApprovedAmountInr(e.target.value)}
                      helperText="Must be greater than ₹0 and cannot exceed requested amount."
                    />

                    <Textarea
                      label="Insurer Comments / Explanation (Optional)"
                      rows={3}
                      placeholder="Add any notes regarding policy deductions or approval terms..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />

                    <Button
                      onClick={handleValidateForm}
                      variant="primary"
                      size="lg"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600"
                      isLoading={isSubmitting}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Approve Claim
                    </Button>
                  </div>
                )}

                {/* REJECT FORM */}
                {decisionAction === 'REJECT' && (
                  <div className="space-y-4 pt-1">
                    <Alert type="warning">
                      Rejection requires a clear explanation that will be communicated to the patient.
                    </Alert>

                    <Textarea
                      label="Reason for Rejection (Required)"
                      rows={4}
                      placeholder="Explain why this claim is being rejected (e.g. missing referral letter, policy exclusion, non-covered procedure)..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      helperText="Minimum 5 characters required."
                    />

                    <Button
                      onClick={handleValidateForm}
                      variant="destructive"
                      size="lg"
                      className="w-full"
                      isLoading={isSubmitting}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Reject Claim
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* DECIDED CLAIM — DECISION SUMMARY CARD */
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Decision Summary</h2>
                  <StatusBadge status={claim.status} size="sm" />
                </div>

                {isApproved && (
                  <div className="p-4 bg-emerald-50/90 rounded-xl border border-emerald-200 text-emerald-950 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Approved Claim</span>
                    </div>

                    <div className="pt-1">
                      <span className="text-xs text-emerald-700 block">Approved Amount</span>
                      <span className="text-2xl font-bold text-emerald-900">
                        {formatCurrency(claim.approvedAmount, { omitZeroPaise: true })}
                      </span>
                    </div>

                    {claim.insurerComments && (
                      <div className="pt-2 border-t border-emerald-200/60 text-xs">
                        <span className="font-semibold text-emerald-800 block">Insurer Comments:</span>
                        <p className="mt-0.5 leading-relaxed text-emerald-950">
                          "{claim.insurerComments}"
                        </p>
                      </div>
                    )}

                    {claim.decidedAt && (
                      <div className="text-[11px] text-emerald-700 pt-1">
                        Decided on {formatDateTime(claim.decidedAt)}
                      </div>
                    )}
                  </div>
                )}

                {isRejected && (
                  <div className="p-4 bg-rose-50/90 rounded-xl border border-rose-200 text-rose-950 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>Claim Rejected</span>
                    </div>

                    {claim.insurerComments && (
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-rose-800 block">Rejection Reason:</span>
                        <p className="leading-relaxed bg-white/70 p-3 rounded-lg border border-rose-200/60">
                          "{claim.insurerComments}"
                        </p>
                      </div>
                    )}

                    {claim.decidedAt && (
                      <div className="text-[11px] text-rose-700 pt-1">
                        Decided on {formatDateTime(claim.decidedAt)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DECISION CONFIRMATION MODAL */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-full ${
                    decisionAction === 'APPROVE'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {decisionAction === 'APPROVE' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {decisionAction === 'APPROVE' ? 'Approve Claim?' : 'Reject Claim?'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Claim reference: <span className="font-mono font-bold">{claim.claimId}</span>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Amount:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(claim.claimAmount, { omitZeroPaise: true })}
                  </span>
                </div>

                {decisionAction === 'APPROVE' && (
                  <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-slate-200">
                    <span>Approved Amount:</span>
                    <span>
                      {formatCurrency(inrToPaise(parseFloat(approvedAmountInr)), { omitZeroPaise: true })}
                    </span>
                  </div>
                )}

                {decisionAction === 'REJECT' && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-slate-500 block">Rejection Reason:</span>
                    <p className="font-medium text-rose-900 mt-0.5 italic">"{comments}"</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500">
                This decision will be permanently recorded in the claim's audit history and notified to the patient.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  variant="outline"
                  size="md"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteDecision}
                  variant={decisionAction === 'APPROVE' ? 'primary' : 'destructive'}
                  size="md"
                  className={
                    decisionAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : ''
                  }
                  isLoading={isSubmitting}
                >
                  Confirm Decision
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
