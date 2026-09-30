import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/router';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import StatusBadge from '../../components/ui/StatusBadge';
import CustodianList from '../../components/shell/CustodianList';
import { useAppData } from '../../context/AppDataContext';
import { claimStatusLabel, formatDate } from '../../lib/constants';

function ClaimsContent() {
  const router = useRouter();
  const { claims, items, handleVerifyClaim, showToast } = useAppData();

  // Claims against items currently in this trusted place's custody.
  const relevant = claims
    .filter((c) => items.find((i) => i.id === c.itemId)?.status === 'custodian_held')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const decide = async (id, status) => {
    try {
      await handleVerifyClaim(id, status);
      showToast(status === 'verified' ? 'Claim verified.' : 'Claim rejected.');
    } catch {
      showToast("You don't have permission to perform this action.");
    }
  };

  return (
    <AppShell back="/custodian" title="Claims">
      <CustodianList
        items={relevant}
        icon={MessageSquare}
        emptyTitle="No claims yet"
        emptyMessage="Claims on items in your custody will show up here."
        render={(c) => (
          <div key={c.id} className="bg-surface border border-line rounded-2xl p-3.5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <button onClick={() => router.push(`/item/${c.itemId}`)} className="font-display font-semibold text-ink text-sm text-left">{c.itemTitle}</button>
              <StatusBadge label={claimStatusLabel(c.status)} tone={c.status === 'verified' ? 'found' : c.status === 'rejected' ? 'lost' : 'brass'} />
            </div>
            <p className="text-xs text-ink-faint">Claimant: {(c.claimerName || '').split(' [')[0]} · {formatDate(c.createdAt)}</p>
            {c.status === 'pending' && !claims.some((x) => x.itemId === c.itemId && x.status === 'verified') && (
              <div className="flex gap-2 pt-1">
                <button onClick={() => decide(c.id, 'rejected')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-line text-ink-soft">Reject</button>
                <button onClick={() => decide(c.id, 'verified')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-found text-white">Verify &amp; Approve</button>
              </div>
            )}
          </div>
        )}
      />
    </AppShell>
  );
}

export default function CustodianClaimsPage() {
  return (
    <Protected role="custodian">
      <ClaimsContent />
    </Protected>
  );
}
