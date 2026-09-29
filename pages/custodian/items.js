import { useState } from 'react';
import { useRouter } from 'next/router';
import { Archive } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import ConfirmModal from '../../components/ui/ConfirmModal';
import StatusBadge from '../../components/ui/StatusBadge';
import CustodianList from '../../components/shell/CustodianList';
import { useAppData } from '../../context/AppDataContext';
import { formatDate } from '../../lib/constants';

const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

function ItemsContent() {
  const router = useRouter();
  const { items, claims, handleMarkUnclaimed, showToast } = useAppData();
  const [target, setTarget] = useState(null);
  const [working, setWorking] = useState(false);

  const held = items.filter((i) => i.status === 'custodian_held');

  const markUnclaimed = async () => {
    setWorking(true);
    try {
      await handleMarkUnclaimed(target);
      showToast('Item marked as unclaimed.');
      setTarget(null);
    } catch {
      showToast("You don't have permission to perform this action.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <AppShell back="/custodian" title="Items in Custody">
      <CustodianList
        items={held}
        icon={Archive}
        emptyTitle="Nothing in custody"
        emptyMessage="Accepted items will be listed here."
        render={(item) => {
          const since = new Date(item.heldAt || item.createdAt).getTime();
          const overdue = Date.now() - since > THREE_DAYS;
          const claimCount = claims.filter((c) => c.itemId === item.id).length;
          return (
            <div key={item.id} className="bg-surface border border-line rounded-2xl p-3 shadow-card space-y-2.5">
              <div className="flex gap-3">
                <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-xl object-cover border border-line flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink text-sm truncate">{item.title}</p>
                  <p className="text-xs text-ink-faint mt-0.5">Found at {item.location} · {formatDate(item.createdAt)}</p>
                  <div className="mt-1 flex gap-1.5">
                    <StatusBadge label="At Trusted Place" tone="brass" />
                    {claimCount > 0 && <StatusBadge label={`${claimCount} claim${claimCount > 1 ? 's' : ''}`} tone="found" />}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push(`/item/${item.id}`)} className="flex-1 py-2 rounded-xl text-xs font-semibold border border-line text-ink-soft">View Item</button>
                {claimCount > 0 && (
                  <button onClick={() => router.push('/custodian/claims')} className="flex-1 py-2 rounded-xl text-xs font-semibold border border-line text-ink-soft">View Claim</button>
                )}
                {overdue && (
                  <button onClick={() => setTarget(item)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-lost text-white">Mark Unclaimed</button>
                )}
              </div>
            </div>
          );
        }}
      />

      <ConfirmModal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={markUnclaimed}
        loading={working}
        destructive
        title="Mark Item as Unclaimed?"
        message="This item will be escalated to management."
        confirmLabel="Mark Unclaimed"
      />
    </AppShell>
  );
}

export default function CustodianItemsPage() {
  return (
    <Protected role="custodian">
      <ItemsContent />
    </Protected>
  );
}
