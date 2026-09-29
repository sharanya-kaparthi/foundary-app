import { useRouter } from 'next/router';
import { Search, PackageX, PackageCheck, ChevronRight } from 'lucide-react';
import AppShell from '../components/shell/AppShell';
import Protected from '../components/shell/Protected';
import { useAppData } from '../context/AppDataContext';

function HomeContent() {
  const router = useRouter();
  const { user } = useAppData();
  const firstName = (user?.displayName || 'there').split(' [')[0];

  return (
    <AppShell>
      <div className="pt-1 pb-2">
        <h2 className="font-display text-xl font-semibold text-ink">Hello, {firstName} 👋</h2>
      </div>

      <div className="space-y-3">
        <section className="bg-surface border border-line rounded-2xl p-4 shadow-card">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-lost-soft text-lost flex items-center justify-center flex-shrink-0">
              <PackageX className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="font-display font-semibold text-ink">Lost something?</p>
              <p className="text-xs text-ink-faint mt-0.5">Tell us what you lost and we'll look for possible matches.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/report-lost')}
            className="w-full bg-lost text-white font-semibold py-3 rounded-xl text-sm focus-ring"
          >
            Report Lost Item
          </button>
        </section>

        <section className="bg-surface border border-line rounded-2xl p-4 shadow-card">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-found-soft text-found flex items-center justify-center flex-shrink-0">
              <PackageCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="font-display font-semibold text-ink">Found something?</p>
              <p className="text-xs text-ink-faint mt-0.5">Help reunite it with its owner.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/report-found')}
            className="w-full bg-found text-white font-semibold py-3 rounded-xl text-sm focus-ring"
          >
            Report Found Item
          </button>
        </section>

        <button
          onClick={() => router.push('/browse')}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-line bg-surface/60 focus-ring"
        >
          <span className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-ink-soft" />
            <span className="text-left">
              <span className="block text-sm font-semibold text-ink">Browse Lost Items</span>
              <span className="block text-xs text-ink-faint">Browse items reported by other users.</span>
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0" />
        </button>
      </div>
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <Protected>
      <HomeContent />
    </Protected>
  );
}
