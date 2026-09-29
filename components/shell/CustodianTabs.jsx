import Link from 'next/link';
import { useRouter } from 'next/router';

const TABS = [
  { href: '/custodian', label: 'Overview' },
  { href: '/custodian/submissions', label: 'Submissions' },
  { href: '/custodian/items', label: 'In Custody' },
  { href: '/custodian/claims', label: 'Claims' },
  { href: '/custodian/unclaimed', label: 'Unclaimed' }
];

// Inline section switcher for the custodian desk — not a bottom nav (the spec
// explicitly rules that out), just a quiet way to move between the five
// custodian screens without going back through the overview each time.
export default function CustodianTabs() {
  const router = useRouter();
  return (
    <div className="flex gap-1 overflow-x-auto pb-3 mb-1 -mx-4 px-4 text-xs">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold border ${
            router.pathname === t.href ? 'bg-ink text-white border-ink' : 'border-line text-ink-faint'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
