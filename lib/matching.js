// Lightweight, fully client-side similarity heuristic between a report and a
// candidate item of the opposite type. This is NOT a call to Gemini or any
// matching backend — there isn't one yet. It's a stand-in so the "Possible
// Matches" screens have real, deterministic numbers derived from the actual
// Firestore items instead of invented placeholder data, until real AI/back-end
// matching is designed. See README for what's stubbed.

function words(text = '') {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
}

function overlapScore(a = '', b = '') {
  const wa = new Set(words(a));
  const wb = new Set(words(b));
  if (wa.size === 0 || wb.size === 0) return 0;
  let hits = 0;
  wa.forEach((w) => { if (wb.has(w)) hits += 1; });
  return hits / Math.max(wa.size, wb.size);
}

export function computeMatchScore(source, candidate) {
  const attribute = source.category && candidate.category && source.category === candidate.category ? 1 : 0;
  const description = overlapScore(
    `${source.title} ${source.description}`,
    `${candidate.title} ${candidate.description}`
  );
  const location = source.location && candidate.location
    ? (source.location.toLowerCase() === candidate.location.toLowerCase() ? 1 : (
        source.location.toLowerCase().includes(candidate.location.toLowerCase()) ||
        candidate.location.toLowerCase().includes(source.location.toLowerCase()) ? 0.5 : 0
      ))
    : 0;
  const daysApart = Math.abs(new Date(source.createdAt) - new Date(candidate.createdAt)) / 86400000;
  const date = Number.isFinite(daysApart) ? Math.max(0, 1 - daysApart / 14) : 0;
  const tagOverlap = overlapScore((source.aiTags || []).join(' '), (candidate.aiTags || []).join(' '));

  const weights = { attribute: 0.25, description: 0.30, location: 0.20, date: 0.10, tags: 0.15 };
  const overall = Math.round(
    (attribute * weights.attribute +
      description * weights.description +
      location * weights.location +
      date * weights.date +
      tagOverlap * weights.tags) * 100
  );

  return {
    overall,
    breakdown: [
      { label: 'Attribute similarity', value: Math.round(attribute * 100), weight: 25 },
      { label: 'Description similarity', value: Math.round(description * 100), weight: 30 },
      { label: 'Location similarity', value: Math.round(location * 100), weight: 20 },
      { label: 'Date proximity', value: Math.round(date * 100), weight: 10 },
      { label: 'Photo-tag similarity', value: Math.round(tagOverlap * 100), weight: 15 }
    ]
  };
}

// Returns candidates of the opposite type, sorted by score, above the given
// confidence threshold (default matches the spec's 70% cutoff).
export function findMatches(sourceItem, allItems, threshold = 70) {
  if (!sourceItem) return [];
  const opposite = sourceItem.type === 'lost' ? 'found' : 'lost';
  return allItems
    .filter((it) => it.id !== sourceItem.id && it.type === opposite && it.status === 'active')
    .map((candidate) => ({ item: candidate, score: computeMatchScore(sourceItem, candidate) }))
    .filter((m) => m.score.overall >= threshold)
    .sort((a, b) => b.score.overall - a.score.overall);
}
