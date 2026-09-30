import { useRouter } from 'next/router';
import { AlertTriangle, Plus } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import EmptyState from '../../components/ui/EmptyState';
import IssueRow from '../../components/issues/IssueRow';
import { useAppData } from '../../context/AppDataContext';
import { issuesReportedBy, issuesAbout, relatedChatClaim } from '../../lib/issues';

const TABS = [
  { key: 'by', label: 'Reported by me' },
  { key: 'about', label: 'About me' }
];

function IssuesContent() {
  const router = useRouter();
  const { user, issues, items, claims } = useAppData();
  const activeTab = router.query.tab === 'about' ? 'about' : 'by';
  const setTab = (tab) => router.replace({ pathname: '/issues', query: { tab } }, undefined, { shallow: true });

  const list = activeTab === 'by'
    ? issuesReportedBy(issues, user?.uid)
    : issuesAbout(issues, items, claims, user?.uid);

  return (
    <AppShell back="/profile" title="My Issues">
      <button
        onClick={() => router.push('/issues/new')}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-line text-ink-soft font-semibold text-sm mb-4"
      >
        <Plus className="w-4 h-4" /> Report an Issue
      </button>

      <div className="flex bg-surface p-1 rounded-xl border border-line mb-4 text-xs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg font-semibold ${activeTab === t.key ? 'bg-ink text-white' : 'text-ink-faint'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title={activeTab === 'by' ? 'No issues reported' : 'Nothing reported about you'}
          message={activeTab === 'by'
            ? 'Anything wrong with a claim, finder, or trusted place shows up here.'
            : 'Issues other people report about you will show up here.'}
        />
      ) : (
        <div className="space-y-2">
          {list.map((iss) => (
            <IssueRow key={iss.id} issue={iss} chatClaimId={relatedChatClaim(iss, items, claims, user?.uid)?.id} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function IssuesPage() {
  return (
    <Protected>
      <IssuesContent />
    </Protected>
  );
}
