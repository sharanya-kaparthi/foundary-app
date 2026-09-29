import { RefreshCw } from 'lucide-react';

export default function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center gap-2 text-ink-faint">
      <RefreshCw className="w-5 h-5 animate-spin" />
      {label && <p className="text-xs">{label}</p>}
    </div>
  );
}
