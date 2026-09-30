// Helpers over the EXISTING `issues` collection (no new collection, no schema change).
//
// Who is an issue "about"? The issue model stores the reporter (reportedByUid)
// and the related item (itemId), but no explicit subject user. So the subject
// is derived from the item and its claims, guided by the issue type:
//   Problem with finder                → the item's finder (item.reporterUid)
//   Problem with claimant / Incorrect claim → the verified claimant(s), else all claimants
//   Item not received                  → the finder
//   Trusted-place problem              → no user (about a place)
//   Other                              → the finder and the verified claimant(s)
// The reporter is never the subject of their own report. Escalation/audit
// records (kind !== 'user_report') are never treated as complaints.

export function issueStatusLabel(status) {
  const labels = { open: 'Open', in_review: 'In Review', resolved: 'Resolved', closed: 'Closed', dismissed: 'Dismissed' };
  if (!status) return 'Open';
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export function issueStatusTone(status) {
  if (status === 'resolved' || status === 'closed') return 'found';
  if (status === 'dismissed') return 'neutral';
  return 'brass';
}

function subjectUids(issue, items, claims) {
  if (issue.kind !== 'user_report' || !issue.itemId) return [];
  const item = items.find((i) => i.id === issue.itemId);
  if (!item) return [];
  const itemClaims = claims.filter((c) => c.itemId === item.id);
  const verified = itemClaims.filter((c) => c.status === 'verified').map((c) => c.claimerUid);
  const claimants = verified.length ? verified : itemClaims.map((c) => c.claimerUid);

  let uids;
  switch (issue.issueType) {
    case 'Problem with finder':
    case 'Item not received':
      uids = [item.reporterUid];
      break;
    case 'Problem with claimant':
    case 'Incorrect claim':
      uids = claimants;
      break;
    case 'Trusted-place problem':
      uids = [];
      break;
    default:
      uids = [item.reporterUid, ...claimants];
  }
  return uids.filter((u) => u && u !== issue.reportedByUid);
}

const byNewest = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);

export function issuesReportedBy(issues, uid) {
  if (!uid) return [];
  return issues.filter((i) => i.reportedByUid === uid).sort(byNewest);
}

export function isIssueAboutUser(issue, items, claims, uid) {
  return Boolean(uid) && issue.reportedByUid !== uid && subjectUids(issue, items, claims).includes(uid);
}

export function issuesAbout(issues, items, claims, uid) {
  if (!uid) return [];
  return issues.filter((i) => isIssueAboutUser(i, items, claims, uid)).sort(byNewest);
}

// The handover chat (a verified claim on the related item) if this user is a
// party to it — either the finder or the claimant.
export function relatedChatClaim(issue, items, claims, uid) {
  if (!issue.itemId || !uid) return null;
  const item = items.find((i) => i.id === issue.itemId);
  if (!item) return null;
  return claims.find((c) => c.itemId === item.id && c.status === 'verified' && (c.claimerUid === uid || item.reporterUid === uid)) || null;
}
