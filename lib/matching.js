// Lightweight, fully client-side similarity heuristic between a report and a
// candidate item of the opposite type. This is NOT a call to Gemini or any
// matching backend. It scores real Firestore items deterministically.
//
// Design rule: every signal is either AVAILABLE (a number 0..1) or UNAVAILABLE
// (null). Unavailable signals — a missing photo, an empty brand, an unknown
// color — are missing evidence, not contradicting evidence, so they are dropped
// and the score is normalised over the signals that actually exist. An image is
// therefore an optional signal: it only contributes (through the Gemini-derived
// `aiTags` already stored on the item) when at least one report has it.

const STOPWORDS = new Set([
  'the', 'and', 'with', 'for', 'was', 'were', 'has', 'have', 'had', 'its', 'this', 'that',
  'found', 'lost', 'find', 'containing', 'contains', 'contain', 'inside', 'near', 'from',
  'some', 'got', 'one', 'are', 'but', 'not', 'you', 'your', 'our', 'any', 'item', 'like'
]);

// Applied after light stemming, so keys are stemmed forms.
const SYNONYMS = {
  purse: 'wallet', billfold: 'wallet', cardholder: 'wallet',
  mobile: 'phone', smartphone: 'phone', cellphone: 'phone', iphone: 'phone',
  earbud: 'earphone', airpod: 'earphone', headphone: 'earphone', headset: 'earphone',
  backpack: 'bag', rucksack: 'bag', handbag: 'bag', sack: 'bag',
  flask: 'bottle', tumbler: 'bottle',
  macbook: 'laptop', notebook: 'laptop',
  identity: 'id', identification: 'id',
  keychain: 'key', keyring: 'key',
  eyeglasse: 'glasse', spectacle: 'glasse', glass: 'glasse',
  hoodie: 'jacket', sweatshirt: 'jacket', sweater: 'jacket',
  gray: 'grey'
};

function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

function tokenize(text) {
  const list = Array.isArray(text) ? text.flat(Infinity) : [text];
  const out = new Set();
  list
    .filter((t) => t !== null && t !== undefined)
    .map((t) => String(t).toLowerCase())
    .join(' ')
    .split(/[^a-z0-9]+/)
    .forEach((raw) => {
      if (raw.length < 2 || STOPWORDS.has(raw)) return;
      const s = stem(raw);
      out.add(SYNONYMS[s] || s);
    });
  return out;
}

// Blend of Dice (symmetric) and containment (short reports vs long ones).
// Returns null when either side has no usable words.
function textSim(a, b) {
  if (a.size === 0 || b.size === 0) return null;
  let hits = 0;
  a.forEach((w) => { if (b.has(w)) hits += 1; });
  const dice = (2 * hits) / (a.size + b.size);
  const containment = hits / Math.min(a.size, b.size);
  return 0.5 * dice + 0.5 * containment;
}

const norm = (v) => String(v ?? '').trim().toLowerCase();
const UNKNOWN = new Set(['', 'unknown', 'other', 'none', 'na', 'n/a', 'nil', '-', 'no brand', 'not sure']);

function categorySignal(a, b) {
  const ca = norm(a.category); const cb = norm(b.category);
  if (UNKNOWN.has(ca) || UNKNOWN.has(cb)) return null;
  return ca === cb ? 1 : 0;
}

function colorSignal(a, b) {
  const ca = norm(a.color).replace('gray', 'grey'); const cb = norm(b.color).replace('gray', 'grey');
  if (UNKNOWN.has(ca) || UNKNOWN.has(cb)) return null;
  return ca === cb ? 1 : 0;
}

function brandSignal(a, b) {
  const ba = norm(a.brand); const bb = norm(b.brand);
  if (UNKNOWN.has(ba) || UNKNOWN.has(bb)) return null;
  if (ba === bb || ba.includes(bb) || bb.includes(ba)) return 1;
  return textSim(tokenize(ba), tokenize(bb)) ?? 0;
}

function locationSignal(a, b) {
  const la = norm(a.location); const lb = norm(b.location);
  if (!la || !lb) return null;
  if (la === lb) return 1;
  return la.includes(lb) || lb.includes(la) ? 0.5 : 0;
}

function dateSignal(a, b) {
  const da = new Date(a.eventDate || a.createdAt);
  const db = new Date(b.eventDate || b.createdAt);
  const days = Math.abs(da - db) / 86400000;
  return Number.isFinite(days) ? Math.max(0, 1 - days / 14) : null;
}

const hasText = (v) => norm(v) !== '';
const tagsOf = (it) => tokenize(it.aiTags || []);

// Image-derived signal. Available if at least one report carries AI tags:
// tags of one report are compared with the tags and the text/metadata of the
// other, so a photo on only the LOST or only the FOUND side still helps.
function tagSignal(a, b) {
  const ta = tagsOf(a); const tb = tagsOf(b);
  if (ta.size === 0 && tb.size === 0) return null;
  const blob = (it) => tokenize([it.title, it.description, it.brand, it.color, it.distinguishingFeatures, it.aiTags]);
  const scores = [];
  if (ta.size) scores.push(textSim(ta, blob(b)));
  if (tb.size) scores.push(textSim(tb, blob(a)));
  if (ta.size && tb.size) scores.push(textSim(ta, tb));
  const valid = scores.filter((s) => s !== null);
  return valid.length ? Math.max(...valid) : null;
}

export function computeMatchScore(source, candidate) {
  const a = source || {};
  const b = candidate || {};

  // If distinguishing features are not given by both sides, fold whichever side
  // has them into the main text comparison instead of discarding them.
  const bothFeatures = hasText(a.distinguishingFeatures) && hasText(b.distinguishingFeatures);
  const body = (it) => tokenize([it.title, it.description, bothFeatures ? '' : it.distinguishingFeatures]);

  const signals = [
    { group: 'Attribute similarity', weight: 0.15, value: categorySignal(a, b) },
    { group: 'Attribute similarity', weight: 0.08, value: colorSignal(a, b) },
    { group: 'Attribute similarity', weight: 0.07, value: brandSignal(a, b) },
    { group: 'Description similarity', weight: 0.30, value: textSim(body(a), body(b)) },
    { group: 'Description similarity', weight: 0.08, value: bothFeatures ? textSim(tokenize(a.distinguishingFeatures), tokenize(b.distinguishingFeatures)) : null },
    { group: 'Location similarity', weight: 0.12, value: locationSignal(a, b) },
    { group: 'Date proximity', weight: 0.08, value: dateSignal(a, b) },
    { group: 'Photo-tag similarity', weight: 0.12, value: tagSignal(a, b) }
  ];

  const live = signals.filter((s) => s.value !== null && s.value !== undefined);
  const availableWeight = live.reduce((n, s) => n + s.weight, 0);
  if (availableWeight === 0) return { overall: 0, breakdown: [] };

  const normalized = live.reduce((n, s) => n + s.weight * s.value, 0) / availableWeight;
  // Mild confidence shrink: fewer corroborating signals => slightly less certain.
  let overall = normalized * (0.85 + 0.15 * availableWeight) * 100;
  // Very little evidence (e.g. only a shared title) can't support a strong match.
  overall = Math.min(overall, (availableWeight / 0.6) * 100);

  // Context (category/color/location/date) alone must not create a strong match
  // when what the reports actually say about the item is dissimilar.
  const desc = live.filter((s) => s.group === 'Description similarity');
  if (desc.length) {
    const dw = desc.reduce((n, s) => n + s.weight, 0);
    const dv = desc.reduce((n, s) => n + s.weight * s.value, 0) / dw;
    overall = Math.min(overall, 50 + 50 * dv);
  }
  overall = Math.max(0, Math.min(100, Math.round(overall)));

  const groups = [...new Set(live.map((s) => s.group))].map((label) => {
    const rows = live.filter((s) => s.group === label);
    const w = rows.reduce((n, s) => n + s.weight, 0);
    return {
      label,
      value: Math.round((rows.reduce((n, s) => n + s.weight * s.value, 0) / w) * 100),
      weight: Math.round((w / availableWeight) * 100)
    };
  });

  return { overall, breakdown: groups };
}

// Returns candidates of the opposite type (LOST <-> FOUND only), sorted by
// score, above the given confidence threshold (default: the spec's 70% cutoff).
export function findMatches(sourceItem, allItems, threshold = 70) {
  if (!sourceItem) return [];
  const opposite = sourceItem.type === 'lost' ? 'found' : 'lost';
  return (allItems || [])
    .filter((it) => it.id !== sourceItem.id && it.type === opposite && it.status === 'active')
    .map((candidate) => ({ item: candidate, score: computeMatchScore(sourceItem, candidate) }))
    .filter((m) => m.score.overall >= threshold)
    .sort((a, b) => b.score.overall - a.score.overall);
}
