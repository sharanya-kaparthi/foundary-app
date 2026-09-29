import { useRouter } from 'next/router';
import { Inbox, Archive, MessageSquare, PackageX, ChevronRight, AlertTriangle } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import { useAppData } from '../../context/AppDataContext';

function CustodianHome() {
  const router = useRouter();
  const { items, claims } = useAppData();

  // STUB: the trusted place's name isn't stored on custodian accounts yet.
  const placeName = 'Central Library';

  const pending = items.filter((i) => i.type === 'found' && i.status === 'active').length;
  const inCustody = items.filter((i) => i.status === 'custodian_held').length;
  const activeClaims = claims.filter((c) => c.status === 'pending').length;
  const unclaimed = items.filter((i) => i.status === 'unclaimed').length;

  const cards = [
    { href: '/custodian/submissions', label: 'Pending Submissions', count: pending, icon: Inbox },
    { href: '/custodian/items', label: 'Items in Custody', count: inCustody, icon: Archive },
    { href: '/custodian/claims', label: 'Active Claims', count: activeClaims, icon: MessageSquare },
    { href: '/custodian/unclaimed', label: 'Unclaimed Items', count: unclaimed, icon: PackageX }
  ];

  return (
    <AppShell>
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-ink">{placeName}</h2>
        <p className="text-xs font-medium text-brass mt-0.5">Trusted Place</p>
      </div>

      <div className="space-y-2">
        {cards.map(({ href, label, count, icon: Icon }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="w-full flex items-center justify-between bg-surface border border-line rounded-2xl p-4 shadow-card focus-ring"
          >
            <span className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-brass-soft text-brass flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold text-ink">{label}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="font-display font-semibold text-ink">{count}</span>
              <ChevronRight className="w-4 h-4 text-ink-faint" />
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push('/issues/new')}
        className="w-full flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl border border-dashed border-line text-ink-soft font-semibold text-sm"
      >
        <AlertTriangle className="w-4 h-4" /> Report an Issue
      </button>
    </AppShell>
  );
}

export default function CustodianIndexPage() {
  return (
    <Protected role="custodian">
      <CustodianHome />
    </Protected>
  );
}
