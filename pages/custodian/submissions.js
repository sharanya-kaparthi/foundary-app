import { useState } from 'react';
import { useRouter } from 'next/router';
import { Inbox } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import ConfirmModal from '../../components/ui/ConfirmModal';
import StatusBadge from '../../components/ui/StatusBadge';
import CustodianList from '../../components/shell/CustodianList';
import { useAppData } from '../../context/AppDataContext';
import { formatDate } from '../../lib/constants';

function SubmissionsContent() {
  const router = useRouter();
  const { items, handleEscalateToCustodian, showToast } = useAppData();
  const [target, setTarget] = useState(null);
  const [accepting, setAccepting] = useState(false);

  // STUB: there is no per-item "submitted to this trusted place" flag shared across
  // users yet (the finder's pending choice lives only in their own browser). Until
  // that exists, every active found item is listed as available to accept.
  const pending = items
    .filter((i) => i.type === 'found' && i.status === 'active')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const accept = async () => {
    setAccepting(true);
    try {
      await handleEscalateToCustodian(target);
      showToast('Item accepted into custody.');
      setTarget(null);
    } catch {
      showToast("You don't have permission to perform this action.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <AppShell back="/custodian" title="Pending Submissions">
      <CustodianList
        items={pending}
        icon={Inbox}
        emptyTitle="No pending submissions"
        emptyMessage="Items handed over to your trusted place will appear here."
        render={(item) => (
          <div key={item.id} className="bg-surface border border-line rounded-2xl p-3 shadow-card space-y-2.5">
            <div className="flex gap-3">
              <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-xl object-cover border border-line flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-display font-semibold text-ink text-sm truncate">{item.title}</p>
                <p className="text-xs text-ink-faint mt-0.5">Finder: {(item.reporterName || '').split(' [')[0]}</p>
                <p className="text-xs text-ink-faint">{formatDate(item.createdAt)}</p>
                <div className="mt-1"><StatusBadge label="Awaiting Acceptance" tone="brass" /></div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push(`/item/${item.id}`)} className="flex-1 py-2 rounded-xl text-xs font-semibold border border-line text-ink-soft">View Item</button>
              <button onClick={() => setTarget(item)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-ink text-white">Accept Item</button>
            </div>
          </div>
        )}
      />

      <ConfirmModal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={accept}
        loading={accepting}
        title="Accept this item?"
        message="Confirm that you physically received this item."
        confirmLabel="Confirm & Accept"
      />
    </AppShell>
  );
}

export default function CustodianSubmissionsPage() {
  return (
    <Protected role="custodian">
      <SubmissionsContent />
    </Protected>
  );
}
