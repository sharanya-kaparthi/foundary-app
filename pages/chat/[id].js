import { useState } from 'react';
import { useRouter } from 'next/router';
import { Send, CheckCircle2 } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import ConfirmModal from '../../components/ui/ConfirmModal';
import EmptyState from '../../components/ui/EmptyState';
import { useAppData } from '../../context/AppDataContext';

function ChatContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user, claims, items, messages, sendMessage, confirmItemClaimed, showToast } = useAppData();
  const [text, setText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const claim = claims.find((c) => c.id === id);
  const item = items.find((it) => it.id === claim?.itemId);

  if (!claim || !item) {
    return (
      <AppShell back="/my-items" title="Chat">
        <EmptyState title="Conversation not found" />
      </AppShell>
    );
  }

  // The chat only opens once the claim has been verified.
  if (claim.status !== 'verified') {
    return (
      <AppShell back="/my-items" title="Chat">
        <EmptyState title="Chat isn't open yet" message="The chat opens once the claim has been verified." />
      </AppShell>
    );
  }

  const isClaimer = user?.uid === claim.claimerUid;
  const otherName = isClaimer ? item.reporterName : claim.claimerName;
  const thread = messages.filter((m) => m.claimId === claim.id).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const closed = item.status === 'claimed';

  const onSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage(claim.id, text);
    setText('');
  };

  const confirmReceipt = async () => {
    setConfirming(true);
    try {
      // The claimant's explicit confirmation is the only thing that sets item.status = 'claimed'.
      await confirmItemClaimed(claim.id);
      showToast('Item recovered.');
      setShowConfirm(false);
    } catch (err) {
      console.error('confirmItemClaimed failed:', err);
      showToast(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AppShell back="/my-items" title={otherName || 'Handover'}>
      <p className="text-[11px] font-semibold text-brass uppercase tracking-wide -mt-2 mb-3">Found Item Handover · {item.title}</p>

      <div className="space-y-2 mb-24">
        {thread.length === 0 ? (
          <p className="text-center text-xs text-ink-faint py-10">No messages yet. Say hello and arrange a handover.</p>
        ) : (
          thread.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.senderUid === user?.uid ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-ink-faint mb-0.5">{m.senderName}</span>
              <div className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm ${m.senderUid === user?.uid ? 'bg-ink text-white rounded-br-sm' : 'bg-surface border border-line text-ink rounded-bl-sm'}`}>
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-app mx-auto bg-paper border-t border-line p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom,0px))' }}>
        {closed ? (
          <p className="text-center text-sm font-medium text-found py-1.5 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Item recovered. This conversation is closed.
          </p>
        ) : (
          <div className="space-y-2">
            <form onSubmit={onSend} className="flex gap-2">
              <input
                value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…"
                className="flex-1 input"
              />
              <button type="submit" className="bg-ink text-white w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 focus-ring" aria-label="Send message">
                <Send className="w-4 h-4" />
              </button>
            </form>
            {isClaimer ? (
              <button onClick={() => setShowConfirm(true)} className="w-full text-center text-xs font-semibold text-ink-soft py-1">
                I Received the Item
              </button>
            ) : (
              <p className="text-center text-[11px] text-ink-faint py-1">The item is marked as recovered once the claimant confirms they received it.</p>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmReceipt}
        loading={confirming}
        title="Confirm Receipt"
        message="Confirm that you physically received the item from the finder."
        confirmLabel="Confirm Receipt"
      />
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <Protected>
      <ChatContent />
    </Protected>
  );
}
