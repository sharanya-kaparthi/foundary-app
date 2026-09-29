import { useRouter } from 'next/router';
import { Bell, CheckCheck } from 'lucide-react';
import AppShell from '../components/shell/AppShell';
import Protected from '../components/shell/Protected';
import EmptyState from '../components/ui/EmptyState';
import { useAppData } from '../context/AppDataContext';

function isToday(iso) {
  const d = new Date(iso);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

function NotificationsContent() {
  const router = useRouter();
  const { notifications, readNotificationIds, markNotificationsRead } = useAppData();

  const sorted = [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const todays = sorted.filter((n) => isToday(n.timestamp));
  const earlier = sorted.filter((n) => !isToday(n.timestamp));
  const unreadCount = notifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  const openNotification = (n) => {
    if (n.itemId) router.push(`/item/${n.itemId}`);
  };

  return (
    <AppShell back="/home" title="Notifications">
      {unreadCount > 0 && (
        <button onClick={markNotificationsRead} className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft mb-3">
          <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
        </button>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" message="Nothing new right now." />
      ) : (
        <div className="space-y-4">
          {todays.length > 0 && <Group label="Today" items={todays} readIds={readNotificationIds} onOpen={openNotification} />}
          {earlier.length > 0 && <Group label="Earlier" items={earlier} readIds={readNotificationIds} onOpen={openNotification} />}
        </div>
      )}
    </AppShell>
  );
}

function Group({ label, items, readIds, onOpen }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-1.5">{label}</p>
      <div className="space-y-1.5">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => onOpen(n)}
            className="w-full text-left bg-surface border border-line rounded-xl p-3 flex items-start gap-2.5"
          >
            {!readIds.includes(n.id) && <span className="w-1.5 h-1.5 rounded-full bg-lost mt-1.5 flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">{n.title}</p>
              <p className="text-xs text-ink-faint mt-0.5">{n.message}</p>
            </div>
            <span className="text-[10px] text-ink-faint flex-shrink-0">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Protected>
      <NotificationsContent />
    </Protected>
  );
}
