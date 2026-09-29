import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Layers, Bell, User as UserIcon } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import OfflineBanner from '../ui/OfflineBanner';
import ToastHost from '../ui/ToastHost';

// The one shared visual frame for every authenticated screen. Top-level tabs
// (home, browse, my-items, notifications, profile) get the full icon header;
// everything opened from within a flow (item detail, chat, a specific match,
// an issue) passes `back` and gets a title + back arrow instead — same shell,
// same max width, same safe-area handling, so the app never feels like it's
// switching products.
export default function AppShell({ children, back, title, customPlaceName }) {
  const router = useRouter();
  const { user, userRole, notifications, readNotificationIds } = useAppData();

  const unread = notifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  return (
    <div className="min-h-screen flex flex-col bg-paper max-w-app mx-auto md:border-x md:border-line relative">
      <OfflineBanner />
      <header
        className="sticky top-0 z-30 bg-paper/95 backdrop-blur-sm border-b border-line px-4 flex items-center justify-between"
        style={{ paddingTop: 'max(0.875rem, env(safe-area-inset-top, 0px))', paddingBottom: '0.875rem' }}
      >
        {back ? (
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => (typeof back === 'string' ? router.push(back) : router.back())}
              aria-label="Go back"
              className="p-1.5 -ml-1.5 rounded-lg text-ink-soft focus-ring"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-semibold text-base text-ink truncate">{title}</h1>
          </div>
        ) : (
          <div>
            <h1 className="font-display font-semibold text-lg tracking-tight text-ink leading-none">Foundary</h1>
            {userRole === 'custodian' ? (
              <p className="text-[11px] text-brass font-medium mt-0.5">Trusted Place</p>
            ) : (
              <p className="text-[11px] text-ink-faint mt-0.5">Campus Lost &amp; Found</p>
            )}
          </div>
        )}

        {!back && (
          <div className="flex items-center gap-1">
            <HeaderIcon href="/my-items" active={router.pathname === '/my-items'} label="My Items" icon={Layers} />
            <HeaderIcon href="/notifications" active={router.pathname === '/notifications'} label="Notifications" icon={Bell} badge={unread} />
            <HeaderIcon href="/profile" active={router.pathname === '/profile'} label="Profile" icon={UserIcon} />
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto app-scroll px-4 py-4" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom,0px))' }}>
        {children}
      </main>

      <ToastHost />
    </div>
  );
}

function HeaderIcon({ href, active, label, icon: Icon, badge }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`relative p-2 rounded-lg border focus-ring ${
        active ? 'border-ink/30 text-ink bg-ink/5' : 'border-transparent text-ink-faint'
      }`}
    >
      <Icon className="w-[18px] h-[18px]" />
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-[3px] rounded-full bg-lost text-white text-[9px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );
}
