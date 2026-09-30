import { useRouter } from 'next/router';
import { MessageSquare } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { formatDate } from '../../lib/constants';
import { issueStatusLabel, issueStatusTone } from '../../lib/issues';

// One issue in a list. `chatClaimId` (optional) adds a link to the related chat.
export default function IssueRow({ issue, chatClaimId }) {
  const router = useRouter();
  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <button onClick={() => router.push(`/issues/${issue.id}`)} className="w-full text-left p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink truncate">{issue.issueType || 'General issue'}</span>
          <StatusBadge label={issueStatusLabel(issue.status)} tone={issueStatusTone(issue.status)} />
        </div>
        <p className="text-xs text-ink-faint mt-0.5 truncate">{issue.itemTitle}</p>
        <p className="text-[11px] text-ink-faint mt-0.5">{formatDate(issue.timestamp)}</p>
        {issue.resolution && (
          <p className="text-xs text-ink-soft bg-paper rounded-lg p-2 mt-2">
            <span className="font-semibold">Update: </span>{issue.resolution}
          </p>
        )}
      </button>
      {chatClaimId && (
        <button
          onClick={() => router.push(`/chat/${chatClaimId}`)}
          className="w-full flex items-center justify-center gap-1.5 border-t border-line py-2 text-xs font-semibold text-ink-soft"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Open related chat
        </button>
      )}
    </div>
  );
}
