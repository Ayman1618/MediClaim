import { useParams } from 'react-router-dom';

export default function InsurerClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Claim Detail (Insurer)</h1>
      <p className="text-slate-400 mt-2 text-sm">
        Phase 2 — GET /claims/{claimId} + PATCH /claims/{claimId}/decision
      </p>
    </div>
  );
}
