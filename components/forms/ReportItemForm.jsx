import { useState } from 'react';
import { useRouter } from 'next/router';
import { Lock, CheckCircle2 } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { useAppData } from '../../context/AppDataContext';
import { CATEGORIES, CAMPUS_LOCATIONS, COLORS } from '../../lib/constants';
import { findMatches } from '../../lib/matching';

const today = () => new Date().toISOString().split('T')[0];

export default function ReportItemForm({ type }) {
  const router = useRouter();
  const { submitReport, items, showToast } = useAppData();
  const isFound = type === 'found';

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [features, setFeatures] = useState('');
  const [eventDate, setEventDate] = useState(today());
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // null | { id, matchCount }

  const resolvedLocation = location === 'Other' ? customLocation : location;

  const onAnalyzed = (parsed) => {
    setAiSuggestions(parsed);
    if (parsed?.title) setTitle((t) => t || parsed.title);
    if (parsed?.category && CATEGORIES.includes(parsed.category)) setCategory(parsed.category);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title || !resolvedLocation) return;
    if (isFound && !imageBase64) return;
    setSubmitting(true);
    try {
      const newId = await submitReport({
        title, type, category, location: resolvedLocation, description,
        brand, color, distinguishingFeatures: features, eventDate,
        imageBase64, aiSuggestions,
        secretQuestion: isFound ? secretQuestion : '',
        secretAnswer: isFound ? secretAnswer : ''
      });

      let matchCount = 0;
      if (!isFound) {
        // Lost items check against existing found items for a same-session
        // "we found possible matches" nudge (real items, heuristic score).
        matchCount = findMatches({ id: newId, title, type, category, location: resolvedLocation, description, createdAt: new Date().toISOString() }, items).length;
      }
      setResult({ id: newId, matchCount });
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="text-center py-10 space-y-5">
        <CheckCircle2 className={`w-12 h-12 mx-auto ${isFound ? 'text-found' : 'text-lost'}`} />
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            {isFound ? 'Thank you for reporting this item' : 'Lost item reported'}
          </h2>
          <p className="text-sm text-ink-faint mt-1.5 max-w-xs mx-auto">
            {isFound
              ? 'Keep the item safe while Foundary looks for its owner.'
              : "Your item has been added to Foundary. We'll look for possible matches."}
          </p>
          {isFound && (
            <p className="text-xs font-semibold text-brass mt-3">You currently have the item.</p>
          )}
        </div>

        {!isFound && result.matchCount > 0 && (
          <div className="bg-brass-soft rounded-xl p-3 text-sm text-brass font-medium">
            We found {result.matchCount} possible match{result.matchCount > 1 ? 'es' : ''}
          </div>
        )}

        <div className="space-y-2 pt-2">
          {!isFound && result.matchCount > 0 && (
            <button onClick={() => router.push(`/matches/${result.id}`)} className="btn-primary">
              View Matches
            </button>
          )}
          <button onClick={() => router.push(`/item/${result.id}`)} className="w-full py-2.5 rounded-xl border border-line text-ink font-semibold text-sm">
            View Item
          </button>
          <button onClick={() => router.push('/home')} className="w-full py-2 text-sm text-ink-faint font-medium">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          {isFound ? 'Report a Found Item' : 'Report a Lost Item'}
        </h2>
        <p className="text-sm text-ink-faint mt-1">
          {isFound ? "Help us return this item to its owner." : "Give us a few details so Foundary can look for possible matches."}
        </p>
      </div>

      <ImageUploadField value={imageBase64} onChange={setImageBase64} onAnalyzed={onAnalyzed} required={isFound} />

      <Field label="Item Name">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Black Leather Wallet" className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Brand">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Dell, Nike" className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Color">
          <select value={color} onChange={(e) => setColor(e.target.value)} className="input">
            {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={`Date ${isFound ? 'Found' : 'Lost'}`}>
          <input type="date" max={today()} value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input" />
        </Field>
      </div>

      <Field label="Distinguishing Features">
        <input
          value={features} onChange={(e) => setFeatures(e.target.value)}
          placeholder="Small silver scratch near the zipper" className="input"
        />
      </Field>

      <Field label={`Location ${isFound ? 'Found' : 'Lost'}`}>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="input">
          {CAMPUS_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        {location === 'Other' && (
          <input
            required value={customLocation} onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Specify location" className="input mt-2"
          />
        )}
      </Field>

      <Field label="Detailed Description">
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Describe the item in as much detail as possible." className="input resize-none"
        />
        <span className="block text-[11px] text-ink-faint mt-1 text-right">{description.length} characters</span>
      </Field>

      {isFound && (
        <div className="bg-brass-soft rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-brass font-semibold text-sm">
            <Lock className="w-4 h-4" /> Ownership Verification
          </div>
          <p className="text-xs text-brass/90 -mt-1.5">Create a question that only the rightful owner is likely to answer.</p>
          <input
            required value={secretQuestion} onChange={(e) => setSecretQuestion(e.target.value)}
            placeholder="e.g. What wallpaper is on the lock screen?" className="input"
          />
          <input
            required value={secretAnswer} onChange={(e) => setSecretAnswer(e.target.value)}
            placeholder="Enter the correct answer" className="input"
          />
          <p className="text-[11px] text-brass/80 leading-relaxed">
            The answer won't be shown publicly. A claimant must answer this correctly before contacting you.
          </p>
        </div>
      )}

      <button type="submit" disabled={submitting} className={`btn-primary ${isFound ? 'tone-found' : 'tone-lost'}`}>
        {submitting ? 'Submitting…' : isFound ? 'Report Found Item' : 'Submit Lost Item'}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-soft mb-1">{label}</span>
      {children}
    </label>
  );
}
