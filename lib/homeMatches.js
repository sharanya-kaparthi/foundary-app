import { findMatches } from './matching';

// Possible Matches for the Home page.
//
// Matches are NOT stored anywhere: they come from the existing client-side
// findMatches() run over the items AppDataContext already holds. We run it for
// each of the CURRENT user's own active lost reports only, then merge the
// results. "Not My Item" dismissals use the same localStorage key as
// /matches/[id], so both pages always agree.

const dismissedKey = (lostItemId) => `foundary:dismissed-matches:${lostItemId}`;

function readDismissed(lostItemId) {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(dismissedKey(lostItemId)) || '[]');
  } catch {
    return [];
  }
}

export function dismissMatch(lostItemId, foundItemId) {
  if (typeof window === 'undefined') return;
  const next = [...new Set([...readDismissed(lostItemId), foundItemId])];
  window.localStorage.setItem(dismissedKey(lostItemId), JSON.stringify(next));
}

// Returns:
//   matches — unique found items, best existing score first (ties: newest first);
//             each is { item, score, lostItem } where lostItem is the user's
//             lost report it matched best.
//   groups  — per lost report that has matches: { lostItem, count }.
export function getHomeMatches(items, uid) {
  if (!uid) return { matches: [], groups: [] };

  const myLost = items.filter((i) => i.type === 'lost' && i.reporterUid === uid && i.status === 'active');
  const best = new Map();
  const groups = [];

  myLost.forEach((lostItem) => {
    const dismissed = readDismissed(lostItem.id);
    const found = findMatches(lostItem, items).filter((m) => !dismissed.includes(m.item.id));
    if (found.length === 0) return;
    groups.push({ lostItem, count: found.length });
    found.forEach((m) => {
      const current = best.get(m.item.id);
      if (!current || m.score.overall > current.score.overall) best.set(m.item.id, { ...m, lostItem });
    });
  });

  const matches = [...best.values()].sort(
    (a, b) => b.score.overall - a.score.overall || new Date(b.item.createdAt) - new Date(a.item.createdAt)
  );
  return { matches, groups };
}
