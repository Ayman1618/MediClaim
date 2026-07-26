/**
 * Login page — placeholder for Phase 2 implementation.
 * The routing infrastructure and auth context are ready.
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">MediClaim</h1>
        <p className="text-slate-500 mb-8">Claims, made clear.</p>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-80">
          <p className="text-slate-400 text-sm">
            Login UI — Phase 2
          </p>
          <p className="text-slate-300 text-xs mt-2">
            Backend ready at POST /auth/login
          </p>
        </div>
      </div>
    </div>
  );
}
