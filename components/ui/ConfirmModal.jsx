import Modal from './Modal';

export default function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, loading = false
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {message && <p className="text-sm text-ink-soft mb-5">{message}</p>}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-line text-ink-soft focus-ring"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white focus-ring disabled:opacity-60 ${
            destructive ? 'bg-lost' : 'bg-ink'
          }`}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
