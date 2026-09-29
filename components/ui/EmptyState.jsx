export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="text-center py-14 px-6 border border-dashed border-line rounded-2xl bg-surface/50">
      {Icon && <Icon className="w-9 h-9 text-ink-faint mx-auto mb-3" strokeWidth={1.5} />}
      <p className="font-display text-ink text-base">{title}</p>
      {message && <p className="text-sm text-ink-faint mt-1 max-w-xs mx-auto">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
