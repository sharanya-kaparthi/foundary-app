import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import EmptyState from '../../components/ui/EmptyState';
import MatchCard from '../../components/items/MatchCard';
import { useAppData } from '../../context/AppDataContext';
import { findMatches } from '../../lib/matching';

function dismissedKey(itemId) { return `foundary:dismissed-matches:${itemId}`; }

function readDismissed(itemId) {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(window.localStorage.getItem(dismissedKey(itemId)) || '[]'); } catch { return []; }
}

function MatchesContent() {
  const router = useRouter();
  const { id } = router.query;
  const { items } = useAppData();
  const [dismissed, setDismissed] = useState([]);

  const item = items.find((it) => it.id === id);

  useEffect(() => {
    if (item) setDismissed(readDismissed(item.id));
  }, [item?.id]);

  if (!item) {
    return (
      <AppShell back="/my-items" title="Possible Matches">
        <EmptyState title="Report not found" />
      </AppShell>
    );
  }

  const allMatches = findMatches(item, items).filter((m) => !dismissed.includes(m.item.id));

  const dismiss = (candidateId) => {
    const next = [...dismissed, candidateId];
    setDismissed(next);
    window.localStorage.setItem(dismissedKey(item.id), JSON.stringify(next));
  };

  return (
    <AppShell back="/my-items" title="Possible Matches">
      <p className="text-sm text-ink-faint mb-4">
        These items have a 70% or higher similarity to your report for <span className="font-semibold text-ink-soft">{item.title}</span>.
      </p>

      {allMatches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No strong matches yet"
          message="We couldn't find a strong match for your item right now. We'll keep your report active as new items are reported."
          action={
            <button onClick={() => router.push('/browse')} className="text-sm font-semibold text-ink underline">
              Browse Lost Items
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {allMatches.map((m) => (
            <MatchCard key={m.item.id} item={m.item} score={m.score} onDismiss={() => dismiss(m.item.id)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function MatchesPage() {
  return (
    <Protected>
      <MatchesContent />
    </Protected>
  );
}
