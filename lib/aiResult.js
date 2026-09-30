// Shape guard for the Gemini image-analysis result.
//
// Gemini is asked for JSON with title / category / estimatedColor / keyFeatures,
// but nothing constrains the *types*: "keyFeatures" (plural) is very often
// returned as an array of strings. Firestore rejects nested arrays, so putting
// that array inside `aiTags: [color, keyFeatures]` made addDoc() throw
// "Nested arrays are not supported" — only when the AI analysis was genuinely
// successful. These helpers make every field a plain string.

export function toText(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ');
  if (typeof value === 'object') return Object.values(value).map(toText).filter(Boolean).join(', ');
  return String(value).trim();
}

// Returns { title, category, estimatedColor, keyFeatures } (all strings), or
// null if the model returned nothing usable — callers must treat null as a
// failed analysis rather than inventing a result.
export function normalizeAiAnalysis(raw) {
  const obj = Array.isArray(raw) ? raw[0] : raw;
  if (!obj || typeof obj !== 'object') return null;
  const out = {
    title: toText(obj.title),
    category: toText(obj.category),
    estimatedColor: toText(obj.estimatedColor),
    keyFeatures: toText(obj.keyFeatures)
  };
  return Object.values(out).some(Boolean) ? out : null;
}

// Flat array of strings, safe to store in Firestore.
export function aiTagsFrom(aiSuggestions) {
  if (!aiSuggestions) return [];
  return [toText(aiSuggestions.estimatedColor), toText(aiSuggestions.keyFeatures)].filter(Boolean);
}
