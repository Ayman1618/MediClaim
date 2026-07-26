/**
 * Application router.
 *
 * Route structure:
 *   / → redirect based on auth state
 *   /login → login page (public, redirect if already authenticated)
 *
 *   Patient routes (PATIENT role required):
 *   /app → patient dashboard
 *   /app/claims/new → submit new claim
 *   /app/claims/:claimId → claim detail
 *
 *   Insurer routes (INSURER role required):
 *   /insurer → insurer dashboard
 *   /insurer/claims/:claimId → claim detail + decision
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth, RedirectIfAuthenticated } from '@/components/RouteGuards';
import LoginPage from '@/pages/LoginPage';
import PatientDashboardPage from '@/pages/patient/PatientDashboardPage';
import MyClaimsPage from '@/pages/patient/MyClaimsPage';
import NewClaimPage from '@/pages/patient/NewClaimPage';
import PatientClaimDetailPage from '@/pages/patient/PatientClaimDetailPage';
import InsurerDashboardPage from '@/pages/insurer/InsurerDashboardPage';
import InsurerClaimDetailPage from '@/pages/insurer/InsurerClaimDetailPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public root — redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes — redirect away if already logged in */}
        <Route element={<RedirectIfAuthenticated />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Patient routes */}
        <Route element={<RequireAuth requiredRole="PATIENT" />}>
          <Route path="/app" element={<PatientDashboardPage />} />
          <Route path="/app/claims" element={<MyClaimsPage />} />
          <Route path="/app/claims/new" element={<NewClaimPage />} />
          <Route path="/app/claims/:claimId" element={<PatientClaimDetailPage />} />
        </Route>

        {/* Insurer routes */}
        <Route element={<RequireAuth requiredRole="INSURER" />}>
          <Route path="/insurer" element={<InsurerDashboardPage />} />
          <Route path="/insurer/claims/:claimId" element={<InsurerClaimDetailPage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
