import { useRouter } from 'next/router';
import { AlertTriangle, Plus } from 'lucide-react';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAppData } from '../../context/AppDataContext';
import { formatDate } from '../../lib/constants';

function IssuesContent() {
  const router = useRouter();
  const { user, issues } = useAppData();

  const mine = issues
    .filter((iss) => iss.reportedByUid === user?.uid)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <AppShell back="/profile" title="My Issues">
      <button
        onClick={() => router.push('/issues/new')}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-line text-ink-soft font-semibold text-sm mb-4"
      >
        <Plus className="w-4 h-4" /> Report an Issue
      </button>

      {mine.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No issues reported" message="Anything wrong with a claim, finder, or trusted place shows up here." />
      ) : (
        <div className="space-y-2">
          {mine.map((iss) => (
            <button
              key={iss.id}
              onClick={() => router.push(`/issues/${iss.id}`)}
              className="w-full text-left bg-surface border border-line rounded-xl p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{iss.issueType || 'General issue'}</span>
                <StatusBadge label={iss.status === 'open' ? 'Open' : iss.status} tone="brass" />
              </div>
              <p className="text-xs text-ink-faint mt-0.5 truncate">{iss.itemTitle}</p>
              <p className="text-[11px] text-ink-faint mt-0.5">{formatDate(iss.timestamp)}</p>
            </button>
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
