import { formatDate } from './constants';

// "My Chats" — derived entirely from data AppDataContext already holds; no new
// collection and no extra Firestore reads.
//
// A chat is a VERIFIED claim (that is exactly when /chat/[claimId] opens). The
// two participants are the claimant (claim.claimerUid) and the finder
// (item.reporterUid). A user's chats are the verified claims where they are
// one of those two — never anyone else's. Chats whose item record no longer
// exists are skipped, because /chat/[claimId] cannot open them.

const displayName = (name) => (name || '').split(' [')[0] || 'Campus Member';

export function getUserChats({ claims, items, messages, uid }) {
  if (!uid) return [];

  const itemById = new Map(items.map((i) => [i.id, i]));

  const lastByClaim = new Map();
  messages.forEach((m) => {
    const cur = lastByClaim.get(m.claimId);
    if (!cur || new Date(m.timestamp) > new Date(cur.timestamp)) lastByClaim.set(m.claimId, m);
  });

  const chats = [];
  claims.forEach((claim) => {
    if (claim.status !== 'verified') return;
    const item = itemById.get(claim.itemId);
    if (!item) return;
    const isClaimer = claim.claimerUid === uid;
    const isFinder = item.reporterUid === uid;
    if (!isClaimer && !isFinder) return;

    const lastMessage = lastByClaim.get(claim.id) || null;
    chats.push({
      claim,
      item,
      otherName: displayName(isClaimer ? item.reporterName : claim.claimerName),
      lastMessage,
      lastFromMe: Boolean(lastMessage && lastMessage.senderUid === uid),
      activityAt: lastMessage?.timestamp || claim.createdAt,
      completed: item.status === 'claimed'
    });
  });

  return chats.sort((a, b) => new Date(b.activityAt) - new Date(a.activityAt));
}

// Today → clock time; otherwise a short date.
export function formatChatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : formatDate(iso);
}
