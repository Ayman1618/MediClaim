import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { getApiErrorMessage } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ShieldCheck, Eye, EyeOff, UserCheck, Building2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        {/* Brand Shield Icon */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-md">
          <ShieldCheck className="w-7 h-7 text-blue-400" />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">MediClaim</h1>
          <p className="text-sm font-semibold tracking-wider uppercase text-slate-500 mt-1">
            Claims, made clear.
          </p>
        </div>

        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          Transparent, effortless healthcare claims management for patients and insurers.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs border border-slate-200/80 rounded-2xl space-y-6">
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

          {/* Quick Demo Credentials Section */}
          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Explore the demo
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
  );
}
