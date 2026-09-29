import { useState } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../../components/shell/AppShell';
import Protected from '../../components/shell/Protected';
import { useAppData } from '../../context/AppDataContext';
import { ISSUE_TYPES } from '../../lib/constants';

function NewIssueContent() {
  const router = useRouter();
  const { itemId } = router.query;
  const { items, reportIssue, showToast } = useAppData();
  const relatedItem = items.find((it) => it.id === itemId);

  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reportIssue({ item: relatedItem, issueType, description });
      setSubmitted(true);
    } catch {
      showToast('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AppShell back="/issues" title="Report an Issue">
        <div className="text-center py-14">
          <p className="font-display text-lg text-ink mb-1.5">Your issue has been sent to management</p>
          <button onClick={() => router.push('/issues')} className="text-sm font-semibold text-ink underline mt-3">View My Issues</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell back title="Report an Issue">
      {relatedItem && (
        <div className="flex items-center gap-2.5 bg-surface border border-line rounded-xl p-2.5 mb-4">
          <img src={relatedItem.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          <p className="text-sm font-medium text-ink truncate">{relatedItem.title}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-xs font-semibold text-ink-soft mb-1">Issue Type</span>
          <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="input">
            {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold text-ink-soft mb-1">Description</span>
          <textarea
            required rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened…" className="input resize-none"
          />
        </label>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Submitting…' : 'Submit Issue'}
        </button>
      </form>
    </AppShell>
  );
}

export default function NewIssuePage() {
  return (
    <Protected>
      <NewIssueContent />
    </Protected>
  );
}
