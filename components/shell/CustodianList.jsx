import EmptyState from '../ui/EmptyState';

// Small shared wrapper so every custodian sub-page renders lists/empty states the same way.
export default function CustodianList({ items, render, emptyTitle, emptyMessage, icon }) {
  if (items.length === 0) return <EmptyState icon={icon} title={emptyTitle} message={emptyMessage} />;
  return <div className="space-y-2.5">{items.map(render)}</div>;
}
