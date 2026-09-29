import { useEffect } from 'react';
import { X } from 'lucide-react';

// Shared overlay for every small interaction the spec calls out (confirmations,
// secret-question verification, match-score explanation, image source choice).
// `variant="sheet"` anchors to the bottom (native-feeling picker); the default
// centers a compact card.
export default function Modal({ open, onClose, title, children, variant = 'center' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isSheet = variant === 'sheet';

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className={`relative w-full max-w-app mx-auto flex ${isSheet ? 'items-end' : 'items-center'} justify-center p-4`}>
        <div
          className={`relative w-full bg-surface shadow-card border border-line ${
            isSheet ? 'rounded-t-2xl rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]' : 'rounded-2xl p-5'
          }`}
        >
          {title && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-ink">{title}</h3>
              <button onClick={onClose} className="p-1 -mr-1 text-ink-faint focus-ring rounded" aria-label="Close">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
