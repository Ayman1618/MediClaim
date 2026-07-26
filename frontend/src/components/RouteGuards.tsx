/**
 * Route guards for protecting frontend routes.
 *
 * These are UX guards — they redirect unauthenticated or unauthorised
 * users to the appropriate page. Backend authorization is the real
 * enforcement layer.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import type { Role } from '@/types';

interface RequireAuthProps {
  requiredRole?: Role;
}

/**
 * Protects routes that require authentication.
 * Optionally restricts to a specific role.
 */
export function RequireAuth({ requiredRole }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to the correct portal based on their actual role
    const redirectTo = user.role === 'INSURER' ? '/insurer' : '/app';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

/**
 * Redirects authenticated users away from public pages (e.g. login).
 */
export function RedirectIfAuthenticated() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (user) {
    const redirectTo = user.role === 'INSURER' ? '/insurer' : '/app';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
