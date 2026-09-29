import Modal from '../ui/Modal';

export default function MatchScoreModal({ open, onClose, score }) {
  if (!score) return null;
  return (
    <Modal open={open} onClose={onClose} title="How is this score calculated?">
      <div className="space-y-2.5">
        {score.breakdown.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">{row.label}</span>
            <span className="font-semibold text-ink">{row.weight}%</span>
          </div>
        ))}
        <div className="pt-2.5 mt-1 border-t border-line flex items-center justify-between">
          <span className="font-display font-semibold text-ink">Overall Match</span>
          <span className="font-display font-semibold text-lg text-brass">{score.overall}%</span>
        </div>
      </div>
      <p className="text-[11px] text-ink-faint mt-4 leading-relaxed">
        This score indicates similarity between the reports. It does not guarantee that the items are the same.
      </p>
    </Modal>
  );
}
