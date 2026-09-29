const TONE_CLASSES = {
  lost: 'bg-lost-soft text-lost',
  found: 'bg-found-soft text-found',
  brass: 'bg-brass-soft text-brass',
  neutral: 'bg-line/70 text-ink-soft'
};

export default function StatusBadge({ label, tone = 'neutral' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${TONE_CLASSES[tone] || TONE_CLASSES.neutral}`}>
      {label}
    </span>
  );
}
