import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { claimsService } from '@/services/claimsService';
import { uploadsService } from '@/services/uploadsService';
import { inrToPaise, formatCurrency, formatDate } from '@/lib/formatters';
import { getApiErrorMessage } from '@/lib/apiClient';
import { Claim } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  UploadCloud,
  X,
  CheckCircle2,
  ArrowRight,
  IndianRupee,
  User,
  Mail,
  FileCheck,
  ArrowLeft,
} from 'lucide-react';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const claimSchema = z.object({
  claimAmountInr: z
    .number({ invalid_type_error: 'Please enter a valid claim amount in Rupees.' })
    .positive('Claim amount must be greater than zero.')
    .max(10000000, 'Claim amount exceeds maximum policy limit.'),
  description: z
    .string()
    .min(10, 'Please provide a more detailed description (min 10 characters).')
    .max(1000, 'Description is too long (max 1000 characters).'),
});

type ClaimFormValues = z.infer<typeof claimSchema>;

export default function NewClaimPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdClaim, setCreatedClaim] = useState<Claim | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
  });

  const handleFileValidation = (file: File): boolean => {
    setFileError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Invalid file type. Please upload a PDF, JPG, or PNG document.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size exceeds the 10 MB limit. Please upload a smaller file.');
      return false;
    }
    setSelectedFile(file);
    return true;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileValidation(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  const onSubmit = async (data: ClaimFormValues) => {
    setSubmitError(null);

    // Validate supporting document requirement
    if (!selectedFile) {
      setFileError('Please attach a supporting document (invoice/bill/discharge summary).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload supporting document file
      const uploadResult = await uploadsService.uploadDocument(selectedFile);

      // Step 2: Convert INR to paise and submit claim
      const paiseAmount = inrToPaise(data.claimAmountInr);
      const claim = await claimsService.createClaim({
        description: data.description,
        claimAmount: paiseAmount,
        documentKeys: [uploadResult.storedName],
      });

      // Invalidate patient claims cache
      queryClient.invalidateQueries({ queryKey: ['patient-claims'] });

      // Set state to display success view
      setCreatedClaim(claim);
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Render Submission Success Confirmation State
  if (createdClaim) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-8 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900">Claim Submitted</h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Your medical claim has been successfully registered and sent to the insurer for review.
              </p>
            </div>

            {/* Claim Summary Box */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-left space-y-3 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Claim Reference
                </span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {createdClaim.claimId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-500 block">Submitted Date</span>
                  <span className="font-medium text-slate-900">
                    {formatDate(createdClaim.submittedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Claim Amount</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(createdClaim.claimAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Initial Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={createdClaim.status} size="sm" />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Patient</span>
                  <span className="font-medium text-slate-900">{createdClaim.patientName}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => navigate(`/app/claims/${createdClaim.claimId}`)}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View claim details
              </Button>
              <Button
                onClick={() => navigate('/app')}
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
              >
                Back to dashboard
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Link
            to="/app"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to overview</span>
          </Link>
        </div>

        <PageHeader
          title="Submit Healthcare Claim"
          description="Provide details and attach supporting medical documents for reimbursement."
        />

        {submitError && <Alert type="error">{submitError}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Patient Context Information */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
              1. Patient Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-slate-500 border border-slate-200">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Patient Name
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {user?.name || 'Priya Sharma'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-slate-500 border border-slate-200">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Patient Email
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {user?.email || 'priya.sharma@example.com'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Claim Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
              2. Claim Expense Details
            </h2>

            <div className="space-y-4">
              <div>
                <Input
                  label="Claim Amount (in ₹ Rupees)"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 3500"
                  leftAddon={<IndianRupee className="w-4 h-4 text-slate-400" />}
                  error={errors.claimAmountInr?.message}
                  helperText="Enter the total medical expense amount in Indian Rupees (₹)."
                  {...register('claimAmountInr', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Textarea
                  label="Description of Medical Treatment / Expense"
                  rows={4}
                  placeholder="Describe the medical condition, treatment received, hospital/clinic name, and breakdown of expenses..."
                  error={errors.description?.message}
                  helperText="Please include hospital/doctor name and key treatment details to assist the reviewer."
                  {...register('description')}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Supporting Document Upload */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
              3. Supporting Document
            </h2>

            {fileError && <Alert type="error">{fileError}</Alert>}

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 ${
                  isDragOver
                    ? 'border-slate-900 bg-slate-50/80'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag and drop document
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PDF, JPG, PNG (Maximum file size: 10 MB)
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                    <FileCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || 'Document'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileError(null);
                  }}
                  variant="outline"
                  size="sm"
                  leftIcon={<X className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  Remove file
                </Button>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <Button
              type="button"
              onClick={() => navigate('/app')}
              variant="outline"
              size="lg"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Submit Claim
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
