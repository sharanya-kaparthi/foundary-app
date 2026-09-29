import { useState } from 'react';
import { useRouter } from 'next/router';
import { Lock, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAppData } from '../../context/AppDataContext';

export default function SecretVerificationModal({ open, onClose, item }) {
  const { submitClaim } = useAppData();
  const router = useRouter();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // null | 'verified' | 'pending'
  const [claimId, setClaimId] = useState(null);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await submitClaim(item, answer.trim());
      setClaimId(res.id);
      if (res.verified) {
        setResult('verified');
      } else {
        setResult('pending');
      }
    } catch {
      setError("That answer doesn't match the verification information.");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setAnswer(''); setError(''); setResult(null);
    onClose();
  };

  if (result === 'verified') {
    return (
      <Modal open={open} onClose={close} title="Ownership Verified">
        <div className="text-center py-2">
          <CheckCircle2 className="w-10 h-10 text-found mx-auto mb-3" />
          <p className="text-sm text-ink-soft mb-5">
            {item.status === 'custodian_held'
              ? 'Your answer matches. Please collect your item from the trusted place.'
              : 'Your answer matches. You can now contact the finder to arrange the handover.'}
          </p>
          {item.status === 'custodian_held' ? (
            <button onClick={close} className="w-full py-2.5 rounded-xl bg-ink text-white text-sm font-semibold focus-ring">
              I Received the Item
            </button>
          ) : (
            <button
              onClick={() => router.push(`/chat/${claimId}`)}
              className="w-full py-2.5 rounded-xl bg-ink text-white text-sm font-semibold focus-ring"
            >
              Open Chat
            </button>
          )}
        </div>
      </Modal>
    );
  }

  if (result === 'pending') {
    return (
      <Modal open={open} onClose={close} title="Claim Submitted">
        <p className="text-sm text-ink-soft mb-5">
          That answer doesn't match closely enough for automatic verification. Your claim has been sent to the finder for manual review.
        </p>
        <button onClick={close} className="w-full py-2.5 rounded-xl bg-ink text-white text-sm font-semibold focus-ring">Got it</button>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={close} title="Ownership Verification">
      <div className="flex items-start gap-2 bg-brass-soft text-brass rounded-xl p-2.5 mb-4">
        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p className="text-xs leading-relaxed">A claimant must answer this question before contacting the finder or collecting the item.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-ink-soft mb-1">{item.secretQuestion}</p>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer"
            required
            className="w-full bg-paper border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus-ring"
          />
        </div>
        {error && <p className="text-xs text-lost">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-ink text-white text-sm font-semibold focus-ring disabled:opacity-60"
        >
          {submitting ? 'Verifying…' : 'Submit Answer'}
        </button>
      </form>
    </Modal>
  );
}
