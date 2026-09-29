// Shared vocabulary used across report forms, filters, and status displays.
// Keeping this in one place is what keeps "Electronics" spelled the same way
// on the report form and the browse filter.

export const CATEGORIES = [
  'Electronics', 'Wallet', 'ID Cards', 'Bag', 'Bottle', 'Keys',
  'Clothing', 'Books', 'Accessories', 'Documents', 'Other'
];

export const CAMPUS_LOCATIONS = [
  'Library', 'Canteen', 'Block A', 'Block B', 'Sports Complex',
  'Auditorium', 'Laboratory', 'Parking Area', 'Hostel', 'Other'
];

export const COLORS = [
  'Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Grey', 'Brown', 'Other'
];

export const TRUSTED_PLACES = [
  { id: 'central-library', name: 'Central Library', building: 'Library Building' },
  { id: 'main-office', name: 'Main Office', building: 'Administration Block' },
  { id: 'security-office', name: 'Security Office', building: 'Main Gate' }
];

export const ISSUE_TYPES = [
  'Problem with finder',
  'Problem with claimant',
  'Item not received',
  'Trusted-place problem',
  'Incorrect claim',
  'Other'
];

// Maps the item's real Firestore `status` field onto the richer, plain-language
// status vocabulary from the spec. The underlying data model is unchanged —
// this is presentation only.
export function itemStatusLabel(item) {
  if (!item) return '';
  if (item.status === 'claimed') return 'Recovered';
  if (item.status === 'unclaimed') return 'Unclaimed';
  if (item.status === 'custodian_held') return 'At Trusted Place';
  return item.type === 'lost' ? 'Active' : 'Finder Responsible';
}

export function itemStatusTone(item) {
  if (!item) return 'neutral';
  if (item.status === 'claimed') return 'found';
  if (item.status === 'unclaimed') return 'lost';
  if (item.status === 'custodian_held') return 'brass';
  return item.type === 'lost' ? 'lost' : 'found';
}

export function claimStatusLabel(status) {
  if (status === 'verified') return 'Verified';
  if (status === 'rejected') return 'Rejected';
  return 'Verification Required';
}

export function humanizeFirebaseError(message = '') {
  const m = message.toLowerCase();
  if (m.includes('user-not-found') || m.includes('wrong-password') || m.includes('invalid-credential')) {
    return "That email and password don't match our records.";
  }
  if (m.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (m.includes('weak-password')) return 'Please choose a password with at least 6 characters.';
  if (m.includes('invalid-email')) return "That doesn't look like a valid email address.";
  if (m.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('requires-recent-login')) return 'Please sign in again before doing this, for your security.';
  if (m.includes('permission-denied')) return "You don't have permission to perform this action.";
  if (m.includes('network')) return 'Network issue — please check your connection and try again.';
  return "Something went wrong. Please try again.";
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return '—';
  }
}
