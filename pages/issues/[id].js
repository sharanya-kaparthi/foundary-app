import { useRouter } from 'next/router';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAppData } from '../../context/AppDataContext';
import { formatDate } from '../../lib/constants';

function IssueDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const { issues } = useAppData();
  const issue = issues.find((iss) => iss.id === id);

  if (!issue) {
    return (
      <AppShell back="/issues" title="Issue">
        <EmptyState title="Issue not found" />
      </AppShell>
    );
  }

  return (
    <AppShell back="/issues" title="Issue Details">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-ink">{issue.issueType || 'General issue'}</span>
          <StatusBadge label="Open" tone="brass" />
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold mb-0.5">Related Item</p>
          <p className="text-sm text-ink-soft">{issue.itemTitle || '—'}</p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold mb-0.5">Description</p>
          <p className="text-sm text-ink-soft leading-relaxed">{issue.reason}</p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold mb-0.5">Reported</p>
          <p className="text-sm text-ink-soft">{formatDate(issue.timestamp)}</p>
        </div>

        <div className="bg-surface border border-line rounded-xl p-3 text-xs text-ink-faint">
          Management responses will appear here once reviewed. There's no management dashboard yet in this build.
        </div>
      </div>
    </AppShell>
  );
}

export default function IssueDetailPage() {
  return (
    <Protected>
      <IssueDetailContent />
    </Protected>
  );
}
