import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import { TRUSTED_PLACES } from '../../lib/constants';

// STUB: there is no trusted-place acceptance workflow in Firestore yet (no
// pending/accepted status on the item, no custodian-side inbox for this).
// This models the flow visually and remembers the "pending" choice per item
// in this browser via localStorage, so it survives a refresh during a demo,
// without inventing new Firestore writes. Swap this for real backend state
// when that's designed.
export function getTrustedPlaceState(itemId) {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(`foundary:trusted-place:${itemId}`) || 'null');
  } catch {
    return null;
  }
}

export default function TrustedPlaceModal({ open, onClose, item, onSubmitted }) {
  const [step, setStep] = useState('choose'); // 'choose' | 'confirm'
  const [place, setPlace] = useState(null);

  const close = () => { setStep('choose'); setPlace(null); onClose(); };

  const confirmHandover = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        `foundary:trusted-place:${item.id}`,
        JSON.stringify({ placeId: place.id, placeName: place.name, status: 'pending', at: new Date().toISOString() })
      );
    }
    onSubmitted?.(place);
    close();
  };

  if (step === 'confirm' && place) {
    return (
      <Modal open={open} onClose={close} title={`Submit to ${place.name}?`}>
        <p className="text-sm text-ink-soft mb-5">Please physically hand the item to the custodian at {place.name}.</p>
        <button onClick={confirmHandover} className="w-full py-2.5 rounded-xl bg-ink text-white text-sm font-semibold mb-2 focus-ring">
          I've Handed Over the Item
        </button>
        <button onClick={() => setStep('choose')} className="w-full py-2.5 rounded-xl border border-line text-ink-soft text-sm font-semibold focus-ring">
          Back
        </button>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} title="Choose a Trusted Place">
      <div className="space-y-2">
        {TRUSTED_PLACES.map((p) => (
          <button
            key={p.id}
            onClick={() => { setPlace(p); setStep('confirm'); }}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-line text-left focus-ring"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">{p.name}</span>
              <span className="block text-xs text-ink-faint">{p.building}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-found">
              <ShieldCheck className="w-3.5 h-3.5" /> Active
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
