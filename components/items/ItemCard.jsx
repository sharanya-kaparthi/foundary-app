import { MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/router';
import StatusBadge from '../ui/StatusBadge';
import { itemStatusLabel, itemStatusTone, formatDate } from '../../lib/constants';

export default function ItemCard({ item, matchCount }) {
  const router = useRouter();
  const accent = item.type === 'lost' ? 'border-l-lost' : 'border-l-found';

  return (
    <button
      onClick={() => router.push(`/item/${item.id}`)}
      className={`w-full text-left bg-surface rounded-2xl border border-line border-l-4 ${accent} shadow-card overflow-hidden focus-ring`}
    >
      <div className="flex gap-3 p-3">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-20 h-20 rounded-xl object-cover bg-paper border border-line flex-shrink-0"
        />
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{item.category}</span>
              <span className="text-[11px] text-ink-faint flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3" /> {formatDate(item.createdAt)}
              </span>
            </div>
            <h3 className="font-display font-semibold text-ink text-[15px] truncate mt-0.5">{item.title}</h3>
            <p className="text-xs text-ink-faint flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {item.location}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <StatusBadge label={itemStatusLabel(item)} tone={itemStatusTone(item)} />
            {typeof matchCount === 'number' && matchCount > 0 && (
              <StatusBadge label={`${matchCount} Possible Match${matchCount > 1 ? 'es' : ''}`} tone="brass" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
