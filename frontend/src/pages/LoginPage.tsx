import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  Users,
  UploadCloud,
  Search,
  ChevronRight,
  IndianRupee,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const user = await login({ email, password });
      if (user.role === 'INSURER') {
        navigate('/insurer');
      } else {
        navigate('/app');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsLoading(true);

    try {
      const user = await login({ email: demoEmail, password: demoPass });
      if (user.role === 'INSURER') {
        navigate('/insurer');
      } else {
        navigate('/app');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row font-sans antialiased text-slate-900">
      {/* ── LEFT PANEL: Product Explanation & Preview (55-60% width) ── */}
      <div className="lg:w-7/12 bg-slate-900 text-white p-8 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background low-contrast grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative z-10 space-y-8 max-w-2xl">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white leading-none block">
                MediClaim
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none block mt-1">
                Claims, made clear
              </span>
            </div>
          </div>

          {/* Headline & Supporting Statement */}
          <div className="space-y-3 pt-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Healthcare claims,
              <br />
              <span className="text-slate-400">without the uncertainty.</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Submit medical expenses, attach supporting evidence, and follow every reimbursement decision from one clear, transparent workspace.
            </p>
          </div>

          {/* Product Benefit Points */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 text-blue-400 shrink-0 mt-0.5">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Submit with confidence
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Attach bills and diagnostic reports alongside your reimbursement request.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Track every decision
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Follow claim status, insurer review comments, and approval details clearly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Built for both sides
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dedicated, role-protected workspaces for patients and insurers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Workflow Steps Indicator (Desktop) */}
        <div className="relative z-10 pt-8 hidden lg:block max-w-lg">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-3 py-2.5 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-300">
              <UploadCloud className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Submit</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            <div className="flex items-center gap-1.5 text-slate-300">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Review</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Decision</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

            <div className="flex items-center gap-1.5 text-slate-300">
              <IndianRupee className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Reimbursement</span>
            </div>
          </div>
        </div>

        {/* Minimal Left Footer */}
        <div className="relative z-10 pt-8 text-[11px] text-slate-500 hidden lg:block">
          © {new Date().getFullYear()} MediClaim. Healthcare claims management platform.
        </div>
      </div>

      {/* ── RIGHT PANEL: Authentication Workspace (40-45% width) ── */}
      <div className="lg:w-5/12 bg-slate-50 p-6 sm:p-10 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>
              <p className="text-xs text-slate-500">
                Sign in to continue to your MediClaim workspace.
              </p>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Email address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign in to MediClaim
              </Button>
            </form>

            {/* Quick Demo Access Section */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Demo Access
                </span>
                <span className="text-[11px] text-slate-400">One-click sign in</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleDemoLogin('priya.sharma@example.com', 'Patient@123')
                  }
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 text-xs font-medium text-slate-700 transition-all text-left group"
                >
                  <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">Patient Demo</div>
                    <div className="text-[10px] text-slate-500">Priya Sharma</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDemoLogin('claims@healthsure.in', 'Insurer@123')
                  }
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300 text-xs font-medium text-slate-700 transition-all text-left group"
                >
                  <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">Insurer Demo</div>
                    <div className="text-[10px] text-slate-500">HealthSure</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
