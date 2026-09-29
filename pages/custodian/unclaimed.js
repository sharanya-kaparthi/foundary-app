import { useRouter } from 'next/router';
import { PackageX } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import StatusBadge from '../../components/ui/StatusBadge';
import CustodianList from '../../components/shell/CustodianList';
import { useAppData } from '../../context/AppDataContext';
import { formatDate } from '../../lib/constants';

function UnclaimedContent() {
  const router = useRouter();
  const { items } = useAppData();
  const unclaimed = items.filter((i) => i.status === 'unclaimed');

  return (
    <AppShell back="/custodian" title="Unclaimed Items">
      <CustodianList
        items={unclaimed}
        icon={PackageX}
        emptyTitle="No unclaimed items"
        emptyMessage="Items you mark as unclaimed are escalated to management and listed here."
        render={(item) => (
          <button
            key={item.id}
            onClick={() => router.push(`/item/${item.id}`)}
            className="w-full text-left bg-surface border border-line rounded-2xl p-3 shadow-card flex gap-3"
          >
            <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-xl object-cover border border-line flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-display font-semibold text-ink text-sm truncate">{item.title}</p>
              <p className="text-xs text-ink-faint mt-0.5">Found {formatDate(item.createdAt)} · {item.location}</p>
              <div className="mt-1"><StatusBadge label="Unclaimed" tone="lost" /></div>
            </div>
          </button>
        )}
      />
    </AppShell>
  );
}

export default function CustodianUnclaimedPage() {
  return (
    <Protected role="custodian">
      <UnclaimedContent />
    </Protected>
  );
}
