import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Trash2, PackageOpen } from 'lucide-react';
import AppShell from '../components/shell/AppShell';
import Protected from '../components/shell/Protected';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmModal from '../components/ui/ConfirmModal';
import ItemCard from '../components/items/ItemCard';
import { useAppData } from '../context/AppDataContext';
import { itemStatusLabel, itemStatusTone, claimStatusLabel, formatDate } from '../lib/constants';
import { findMatches } from '../lib/matching';

const TABS = ['Lost', 'Found', 'Claims', 'Recovered'];

function MyItemsContent() {
  const router = useRouter();
  const { user, items, claims, deleteItem, showToast } = useAppData();
  const activeTab = TABS.includes(router.query.tab) ? router.query.tab : 'Lost';
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setTab = (tab) => router.replace({ pathname: '/my-items', query: { tab } }, undefined, { shallow: true });

  const myLost = useMemo(() => items.filter((i) => i.type === 'lost' && i.reporterUid === user?.uid), [items, user]);
  const myFound = useMemo(() => items.filter((i) => i.type === 'found' && i.reporterUid === user?.uid), [items, user]);
  const myClaims = useMemo(() => claims.filter((c) => c.claimerUid === user?.uid), [claims, user]);
  const recovered = useMemo(() => {
    const claimedItemIds = new Set(myClaims.filter((c) => c.status === 'verified').map((c) => c.itemId));
    return items.filter((i) => i.status === 'claimed' && (i.reporterUid === user?.uid || claimedItemIds.has(i.id)));
  }, [items, myClaims, user]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(deleteTarget.id);
      showToast('Record deleted.');
      setDeleteTarget(null);
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell back="/home" title="My Items">
      <div className="flex bg-surface p-1 rounded-xl border border-line mb-4 text-xs">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`flex-1 py-1.5 rounded-lg font-semibold ${activeTab === tab ? 'bg-ink text-white' : 'text-ink-faint'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Lost' && (
        <List
          empty="No lost items reported yet."
          items={myLost}
          render={(item) => (
            <div key={item.id} className="relative">
              <ItemCard item={item} matchCount={item.status === 'active' ? findMatches(item, items).length : 0} />
            </div>
          )}
        />
      )}

      {activeTab === 'Found' && (
        <List empty="No found items reported yet." items={myFound} render={(item) => <ItemCard key={item.id} item={item} />} />
      )}

      {activeTab === 'Claims' && (
        <List
          empty="You haven't filed any claims yet."
          items={myClaims}
          render={(c) => (
            <button
              key={c.id}
              onClick={() => router.push(c.status === 'verified' && items.find((i) => i.id === c.itemId)?.status === 'active' ? `/chat/${c.id}` : `/item/${c.itemId}`)}
              className="w-full text-left bg-surface border border-line rounded-2xl p-3.5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-ink text-sm">{c.itemTitle}</span>
                <StatusBadge label={claimStatusLabel(c.status)} tone={c.status === 'verified' ? 'found' : c.status === 'rejected' ? 'lost' : 'brass'} />
              </div>
              <p className="text-xs text-ink-faint mt-1">{formatDate(c.createdAt)}</p>
            </button>
          )}
        />
      )}

      {activeTab === 'Recovered' && (
        <List
          empty="No recovered items yet."
          items={recovered}
          render={(item) => (
            <div key={item.id} className="bg-surface border border-line rounded-2xl p-3.5 shadow-card space-y-2">
              <button onClick={() => router.push(`/item/${item.id}`)} className="w-full text-left flex gap-3">
                <img src={item.imageUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover border border-line flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink text-sm truncate">{item.title}</p>
                  <p className="text-xs text-ink-faint mt-0.5">Reported {item.type} · Recovered</p>
                </div>
              </button>
              <button
                onClick={() => setDeleteTarget(item)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-lost py-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Record
              </button>
            </div>
          )}
        />
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        destructive
        title="Delete this record?"
        message="This recovered item will be removed from your account."
        confirmLabel="Delete"
      />
    </AppShell>
  );
}

function List({ items, render, empty }) {
  if (items.length === 0) return <EmptyState icon={PackageOpen} title="Nothing here yet" message={empty} />;
  return <div className="space-y-2.5">{items.map(render)}</div>;
}

export default function MyItemsPage() {
  return (
    <Protected>
      <MyItemsContent />
    </Protected>
  );
}
