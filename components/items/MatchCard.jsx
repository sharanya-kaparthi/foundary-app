import { useState } from 'react';
import { useRouter } from 'next/router';
import { Info, MapPin } from 'lucide-react';
import { formatDate } from '../../lib/constants';
import MatchScoreModal from './MatchScoreModal';

export default function MatchCard({ item, score, onDismiss }) {
  const router = useRouter();
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const tone = score.overall >= 85 ? 'text-found' : 'text-brass';

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-card p-3 space-y-3">
      <div className="flex gap-3">
        <img src={item.imageUrl} alt={item.title} className="w-20 h-20 rounded-xl object-cover bg-paper border border-line flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-ink text-[15px] truncate">{item.title}</h3>
            <button
              onClick={() => setShowScoreInfo(true)}
              className={`flex items-center gap-1 text-sm font-bold flex-shrink-0 ${tone}`}
              aria-label="How this score is calculated"
            >
              {score.overall}% <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-ink-faint mt-0.5">{item.category} · {item.description ? item.description.slice(0, 40) : 'No description'}</p>
          <p className="text-xs text-ink-faint flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {item.location} · {formatDate(item.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-line">
        <button
          onClick={() => router.push(`/item/${item.id}`)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border border-line text-ink-soft focus-ring"
        >
          View Item
        </button>
        <button
          onClick={() => router.push(`/item/${item.id}?claim=1`)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-ink text-white focus-ring"
        >
          Claim Item
        </button>
      </div>
      <button onClick={onDismiss} className="w-full text-center text-[11px] font-medium text-ink-faint">
        Not My Item
      </button>

      <MatchScoreModal open={showScoreInfo} onClose={() => setShowScoreInfo(false)} score={score} />
    </div>
  );
}
