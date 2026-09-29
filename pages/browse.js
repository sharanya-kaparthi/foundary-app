import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, HelpCircle } from 'lucide-react';
import AppShell from '../components/shell/AppShell';
import Protected from '../components/shell/Protected';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ItemCard from '../components/items/ItemCard';
import { useAppData } from '../context/AppDataContext';
import { CATEGORIES, CAMPUS_LOCATIONS } from '../lib/constants';

function BrowseContent() {
  const { items } = useAppData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [filterType !== 'all', filterCategory !== 'All', filterLocation !== 'All'].filter(Boolean).length;

  const filteredItems = useMemo(() => items
    .filter((item) => {
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const matchesLocation = filterLocation === 'All' || item.location === filterLocation;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        item.title?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term);
      return matchesType && matchesCategory && matchesLocation && matchesSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  [items, filterType, filterCategory, filterLocation, searchTerm]);

  return (
    <AppShell back="/home" title="Browse Lost & Found">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text" placeholder="Search items…" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="relative w-11 h-11 flex-shrink-0 rounded-xl border border-line bg-surface flex items-center justify-center text-ink-soft focus-ring"
            aria-label="Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brass text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="space-y-2.5">
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No items found"
              message="Try adjusting your search or filters, or report a new item."
            />
          ) : (
            filteredItems.map((item) => <ItemCard key={item.id} item={item} />)
          )}
        </div>
      </div>

      <Modal open={showFilters} onClose={() => setShowFilters(false)} variant="sheet" title="Filters">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-ink-soft mb-1.5">Status</p>
            <div className="flex bg-paper p-1 rounded-lg border border-line">
              {['all', 'lost', 'found'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize ${filterType === t ? 'bg-ink text-white' : 'text-ink-faint'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-ink-soft mb-1.5">Category</span>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input">
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-ink-soft mb-1.5">Location</span>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="input">
              <option value="All">All Locations</option>
              {CAMPUS_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <button onClick={() => setShowFilters(false)} className="btn-primary">Show {filteredItems.length} results</button>
        </div>
      </Modal>
    </AppShell>
  );
}

export default function BrowsePage() {
  return (
    <Protected>
      <BrowseContent />
    </Protected>
  );
}
