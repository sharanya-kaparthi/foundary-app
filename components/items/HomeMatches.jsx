import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Sparkles, ChevronRight } from 'lucide-react';
import MatchCard from './MatchCard';
import { useAppData } from '../../context/AppDataContext';
import { getHomeMatches, dismissMatch } from '../../lib/homeMatches';

const MAX_ON_HOME = 3;

// Home section: possible matches for the current user's own lost reports.
// Renders nothing at all when there are none (no empty section, no placeholder).
export default function HomeMatches() {
  const router = useRouter();
  const { user, items } = useAppData();
  const [dismissTick, setDismissTick] = useState(0); // re-run after a "Not My Item"

  const { matches, groups } = useMemo(() => getHomeMatches(items, user?.uid), [items, user?.uid, dismissTick]);

  if (matches.length === 0) return null;

  const shown = matches.slice(0, MAX_ON_HOME);
  const manyLostReports = groups.length > 1;

  return (
    <section className="pt-2">
      <h3 className="font-display text-base font-semibold text-ink flex items-center gap-1.5 mb-2">
        <Sparkles className="w-4 h-4 text-brass" /> Possible Matches
      </h3>

      <div className="space-y-3">
        {shown.map((m) => (
          <div key={m.item.id}>
            {manyLostReports && (
              <p className="text-[11px] text-ink-faint mb-1 truncate">For your lost item: {m.lostItem.title}</p>
            )}
            <MatchCard
              item={m.item}
              score={m.score}
              onDismiss={() => { dismissMatch(m.lostItem.id, m.item.id); setDismissTick((t) => t + 1); }}
            />
          </div>
        ))}
      </div>

      {/* The existing matches page is per lost report (/matches/[lostItemId]). */}
      <div className="mt-2 space-y-1">
        {groups.map((g) => (
          <button
            key={g.lostItem.id}
            onClick={() => router.push(`/matches/${g.lostItem.id}`)}
            className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-ink-soft py-1.5"
          >
            {manyLostReports ? `View all ${g.count} for “${g.lostItem.title}”` : 'View All Matches'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </section>
  );
}
