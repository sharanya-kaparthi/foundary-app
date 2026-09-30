import { useRouter } from 'next/router';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { useAppData } from '../../context/AppDataContext';
import { formatDate } from '../../lib/constants';
import { isIssueAboutUser, issueStatusLabel, issueStatusTone, relatedChatClaim } from '../../lib/issues';

function IssueDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const { user, issues, items, claims } = useAppData();
  const issue = issues.find((iss) => iss.id === id);

  const isReporter = Boolean(issue) && issue.reportedByUid === user?.uid;
  const isSubject = Boolean(issue) && isIssueAboutUser(issue, items, claims, user?.uid);

  // Only the person who filed an issue, or the person it concerns, can open it.
  if (!issue || (!isReporter && !isSubject)) {
    return (
      <AppShell back="/issues" title="Issue">
        <EmptyState title="Issue not found" />
      </AppShell>
    );
  }

  const relatedItem = items.find((it) => it.id === issue.itemId);
  const chatClaim = relatedChatClaim(issue, items, claims, user?.uid);

  return (
    <AppShell back="/issues" title="Issue Details">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-ink">{issue.issueType || 'General issue'}</span>
          <StatusBadge label={issueStatusLabel(issue.status)} tone={issueStatusTone(issue.status)} />
        </div>

        <StatusBadge label={isReporter ? 'Reported by you' : 'Reported about you'} tone={isReporter ? 'neutral' : 'lost'} />

        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold mb-0.5">Related Item</p>
          {relatedItem ? (
            <button onClick={() => router.push(`/item/${relatedItem.id}`)} className="text-sm text-ink-soft underline text-left">{relatedItem.title}</button>
          ) : (
            <p className="text-sm text-ink-soft">{issue.itemTitle || '—'}</p>
          )}
        </div>

        {chatClaim && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold mb-0.5">Related Chat</p>
            <button onClick={() => router.push(`/chat/${chatClaim.id}`)} className="text-sm text-ink-soft underline">Open handover chat</button>
          </div>
        )}

        {isReporter ? (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold mb-0.5">Description</p>
            <p className="text-sm text-ink-soft leading-relaxed">{issue.reason}</p>
          </div>
        ) : (
          <p className="text-xs text-ink-faint bg-surface border border-line rounded-xl p-3">
            Someone reported an issue involving you on this item. The details and the reporter's identity are shared with management only.
          </p>
        )}

        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold mb-0.5">Reported</p>
          <p className="text-sm text-ink-soft">{formatDate(issue.timestamp)}</p>
        </div>

        {issue.resolution ? (
          <div className="bg-surface border border-line rounded-xl p-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold mb-0.5">Resolution / Update</p>
            <p className="text-sm text-ink-soft">{issue.resolution}</p>
            {issue.resolvedAt && <p className="text-[11px] text-ink-faint mt-1">{formatDate(issue.resolvedAt)}</p>}
          </div>
        ) : (
          <div className="bg-surface border border-line rounded-xl p-3 text-xs text-ink-faint">
            Management responses will appear here once reviewed. There's no management dashboard yet in this build.
          </div>
        )}
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
