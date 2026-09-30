import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { MessageSquare, ChevronRight } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { useAppData } from '../../context/AppDataContext';
import { getUserChats, formatChatTime } from '../../lib/chats';

const PREVIEW = 5;

// Profile section listing the current user's chats. Each card opens the
// existing /chat/[claimId] page.
export default function MyChats() {
  const router = useRouter();
  const { user, claims, items, messages, dataReady } = useAppData();
  const [showAll, setShowAll] = useState(false);

  const chats = useMemo(
    () => getUserChats({ claims, items, messages, uid: user?.uid }),
    [claims, items, messages, user?.uid]
  );
  const visible = showAll ? chats : chats.slice(0, PREVIEW);

  return (
    <section className="mb-5">
      <h3 className="font-display text-base font-semibold text-ink flex items-center gap-1.5 mb-2">
        <MessageSquare className="w-4 h-4 text-ink-soft" /> My Chats
        {dataReady && chats.length > 0 && <span className="text-xs font-medium text-ink-faint">({chats.length})</span>}
      </h3>

      {!dataReady ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading chats">
          {[0, 1].map((n) => (
            <div key={n} className="bg-surface border border-line rounded-xl p-3 flex gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-line/70 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-1/2 rounded bg-line/70" />
                <div className="h-3 w-3/4 rounded bg-line/70" />
              </div>
            </div>
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-ink">No chats yet</p>
          <p className="text-xs text-ink-faint mt-1">When a claim on a found item is verified, your conversation with the other person will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((chat) => (
            <button
              key={chat.claim.id}
              onClick={() => router.push(`/chat/${chat.claim.id}`)}
              className="w-full text-left bg-surface border border-line rounded-xl p-3 flex gap-3 focus-ring"
            >
              <img src={chat.item.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-line flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink truncate">{chat.item.title}</span>
                  <span className="text-[10px] text-ink-faint flex-shrink-0">{formatChatTime(chat.activityAt)}</span>
                </div>
                <p className="text-xs text-ink-faint truncate">with {chat.otherName}</p>
                <p className="text-xs text-ink-soft truncate mt-0.5">
                  {chat.lastMessage
                    ? `${chat.lastFromMe ? 'You: ' : ''}${chat.lastMessage.text}`
                    : 'No messages yet'}
                </p>
                <div className="mt-1.5">
                  <StatusBadge label={chat.completed ? 'Completed' : 'Active'} tone={chat.completed ? 'found' : 'brass'} />
                </div>
              </div>
            </button>
          ))}
          {chats.length > PREVIEW && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-ink-soft py-1.5"
            >
              {showAll ? 'Show fewer' : `View all ${chats.length}`}
              {!showAll && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
