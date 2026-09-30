import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MapPin, Clock, Tag, Palette, ShieldCheck, MessageSquare } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import SecretVerificationModal from '../../components/forms/SecretVerificationModal';
import TrustedPlaceModal, { getTrustedPlaceState } from '../../components/forms/TrustedPlaceModal';
import { useAppData } from '../../context/AppDataContext';
import { itemStatusLabel, itemStatusTone, formatDate, claimStatusLabel } from '../../lib/constants';
import { findMatches } from '../../lib/matching';

function ItemDetailContent() {
  const router = useRouter();
  const { id, claim } = router.query;
  const { items, claims, user, showToast, handleVerifyClaim, confirmItemClaimed } = useAppData();
  const [showClaimModal, setShowClaimModal] = useState(false);
  // router.query is empty on the first (static) render, so open the modal once it's populated.
  useEffect(() => { if (claim) setShowClaimModal(true); }, [claim]);
  const [showTrustedPlace, setShowTrustedPlace] = useState(false);
  const [showReceived, setShowReceived] = useState(false);
  const [receiving, setReceiving] = useState(false);

  const item = items.find((it) => it.id === id);

  if (!item) {
    return (
      <AppShell back="/browse" title="Item">
        <EmptyState title="Item not found" message="This item may have been removed." />
      </AppShell>
    );
  }

  const isOwner = user && item.reporterUid === user.uid;
  const trustedPlaceState = getTrustedPlaceState(item.id);
  const itemClaims = claims.filter((c) => c.itemId === item.id);
  const alreadyRecovered = item.status === 'claimed';
  // A verified claim only opens the handover; the item stays un-claimed until
  // the claimant confirms receipt.
  const verifiedClaim = itemClaims.find((c) => c.status === 'verified');
  const myVerifiedClaim = verifiedClaim && verifiedClaim.claimerUid === user?.uid ? verifiedClaim : null;

  const confirmReceived = async () => {
    setReceiving(true);
    try {
      await confirmItemClaimed(myVerifiedClaim.id);
      showToast('Item recovered.');
      setShowReceived(false);
    } catch (err) {
      console.error('confirmItemClaimed failed:', err);
      showToast(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setReceiving(false);
    }
  };
  const possibleMatches = item.type === 'found' ? findMatches(item, items) : [];

  return (
    <AppShell back="/browse" title={item.title}>
      <div className="space-y-4">
        <img src={item.imageUrl} alt={item.title} className="w-full h-56 rounded-2xl object-cover border border-line" />

        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <StatusBadge label={itemStatusLabel(item)} tone={itemStatusTone(item)} />
            <StatusBadge label={item.type === 'lost' ? 'Lost' : 'Found'} tone={item.type === 'lost' ? 'lost' : 'found'} />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink">{item.title}</h2>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow icon={Tag} label="Category" value={item.category} />
          <InfoRow icon={Palette} label="Color" value={item.color || '—'} />
          <InfoRow icon={MapPin} label="Location" value={item.location} />
          <InfoRow icon={Clock} label="Date" value={formatDate(item.createdAt)} />
        </dl>

        {item.distinguishingFeatures && (
          <Section title="Distinguishing Features"><p className="text-sm text-ink-soft">{item.distinguishingFeatures}</p></Section>
        )}

        <Section title="Description">
          <p className="text-sm text-ink-soft leading-relaxed">{item.description || 'No further description provided.'}</p>
        </Section>

        <button
          onClick={() => router.push(`/issues/new?itemId=${item.id}`)}
          className="text-xs font-semibold text-ink-faint underline"
        >
          Report an issue with this item
        </button>

        {trustedPlaceState?.status === 'pending' && (
          <div className="bg-brass-soft text-brass text-sm font-medium rounded-xl p-3">
            Awaiting Trusted Place Acceptance — the item remains under the finder's responsibility until {trustedPlaceState.placeName} accepts it.
          </div>
        )}

        {item.type === 'found' && (
          <Section title="Possible Owner Matches">
            {possibleMatches.length === 0 ? (
              <p className="text-sm text-ink-faint">No verified claim yet.</p>
            ) : (
              <p className="text-sm text-ink-soft">{possibleMatches.length} possible owner match{possibleMatches.length > 1 ? 'es' : ''} found for this item.</p>
            )}
          </Section>
        )}

        {isOwner && itemClaims.length > 0 && (
          <Section title="Claim Requests">
            <div className="space-y-2">
              {itemClaims.map((c) => (
                <div key={c.id} className="border border-line rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">{c.claimerName}</span>
                    <StatusBadge
                      label={alreadyRecovered && c.status !== 'verified' ? 'Item Already Recovered' : claimStatusLabel(c.status)}
                      tone={c.status === 'verified' ? 'found' : c.status === 'rejected' ? 'lost' : 'brass'}
                    />
                  </div>
                  <p className="text-xs text-ink-faint bg-paper rounded-lg p-2">{c.claimedAnswer}</p>
                  {c.status === 'verified' && item.status !== 'custodian_held' && (
                    <button onClick={() => router.push(`/chat/${c.id}`)} className="w-full py-1.5 rounded-lg text-xs font-semibold bg-ink text-white">Open Chat</button>
                  )}
                  {c.status === 'pending' && !alreadyRecovered && !verifiedClaim && (
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleVerifyClaim(c.id, 'rejected')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-line text-ink-soft">Reject</button>
                      <button onClick={() => handleVerifyClaim(c.id, 'verified')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-found text-white">Verify &amp; Approve</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 px-4 pt-3 mt-6 bg-gradient-to-t from-paper via-paper to-transparent">
        {item.type === 'found' && !isOwner && item.status !== 'claimed' && !verifiedClaim && (
          <button onClick={() => setShowClaimModal(true)} className="btn-primary">Claim Item</button>
        )}
        {item.type === 'found' && !isOwner && item.status !== 'claimed' && verifiedClaim && !myVerifiedClaim && (
          <p className="text-center text-xs text-ink-faint py-2">A claim on this item has been verified and is awaiting handover.</p>
        )}
        {myVerifiedClaim && item.status === 'active' && (
          <button onClick={() => router.push(`/chat/${myVerifiedClaim.id}`)} className="btn-primary">Open Chat</button>
        )}
        {myVerifiedClaim && item.status === 'custodian_held' && (
          <button onClick={() => setShowReceived(true)} className="btn-primary">I Received the Item</button>
        )}
        {item.type === 'found' && isOwner && item.status === 'active' && !trustedPlaceState && (
          <button onClick={() => setShowTrustedPlace(true)} className="w-full py-2.5 rounded-xl border border-line text-ink font-semibold text-sm flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Submit to Trusted Place
          </button>
        )}
        {item.status === 'claimed' && (
          <div className="flex items-center justify-center gap-1.5 text-found text-sm font-semibold py-2">
            <MessageSquare className="w-4 h-4" /> Item Recovered
          </div>
        )}
      </div>

      <SecretVerificationModal open={showClaimModal} onClose={() => { setShowClaimModal(false); router.replace(`/item/${item.id}`, undefined, { shallow: true }); }} item={item} />
      <ConfirmModal
        open={showReceived}
        onClose={() => setShowReceived(false)}
        onConfirm={confirmReceived}
        loading={receiving}
        title="Confirm Receipt"
        message="Confirm that you collected the item from the trusted place."
        confirmLabel="Confirm Receipt"
      />
      <TrustedPlaceModal
        open={showTrustedPlace}
        onClose={() => setShowTrustedPlace(false)}
        item={item}
        onSubmitted={(place) => showToast(`Waiting for ${place.name} to accept the item.`)}
      />
    </AppShell>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-ink-faint mt-0.5 flex-shrink-0" />
      <div>
        <dt className="text-[10px] uppercase tracking-wide text-ink-faint font-semibold">{label}</dt>
        <dd className="text-ink-soft">{value}</dd>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-t border-line pt-3">
      <p className="text-xs font-semibold text-ink-soft mb-1.5">{title}</p>
      {children}
    </div>
  );
}

export default function ItemDetailPage() {
  return (
    <Protected>
      <ItemDetailContent />
    </Protected>
  );
}
