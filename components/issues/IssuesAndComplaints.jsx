import { useRouter } from 'next/router';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import IssueRow from './IssueRow';
import { useAppData } from '../../context/AppDataContext';
import { issuesReportedBy, issuesAbout, relatedChatClaim } from '../../lib/issues';

const PREVIEW = 3;

// Profile section. Reads the existing `issues` data: "Reported by you" are
// issues you filed; "Reported about you" are issues others filed that concern
// you (derived — see lib/issues.js).
export default function IssuesAndComplaints() {
  const router = useRouter();
  const { user, issues, items, claims } = useAppData();
  const byMe = issuesReportedBy(issues, user?.uid);
  const aboutMe = issuesAbout(issues, items, claims, user?.uid);

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-base font-semibold text-ink flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-ink-soft" /> Issues &amp; Complaints
        </h3>
        <button onClick={() => router.push('/issues/new')} className="text-xs font-semibold text-ink-soft underline">
          Report an Issue
        </button>
      </div>

      <Group
        title="Reported by you"
        emptyText="You haven't reported any issues."
        list={byMe}
        tab="by"
        render={(iss) => <IssueRow key={iss.id} issue={iss} chatClaimId={relatedChatClaim(iss, items, claims, user?.uid)?.id} />}
      />
      <Group
        title="Reported about you"
        emptyText="No issues have been reported about you."
        list={aboutMe}
        tab="about"
        render={(iss) => <IssueRow key={iss.id} issue={iss} chatClaimId={relatedChatClaim(iss, items, claims, user?.uid)?.id} />}
      />
    </section>
  );
}

function Group({ title, emptyText, list, tab, render }) {
  const router = useRouter();
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-ink-soft mb-1.5">{title} ({list.length})</p>
      {list.length === 0 ? (
        <p className="text-xs text-ink-faint bg-surface border border-line rounded-xl p-3">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {list.slice(0, PREVIEW).map(render)}
          {list.length > PREVIEW && (
            <button
              onClick={() => router.push(`/issues?tab=${tab}`)}
              className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-ink-soft py-1.5"
            >
              View all {list.length} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
