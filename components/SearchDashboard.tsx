'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Tag, Palette, User, Layers, ChevronRight, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { GarmentPublic } from '@/lib/sheets';

interface SearchDashboardProps {
  teamPin: string | null;
}

export default function SearchDashboard({ teamPin }: SearchDashboardProps) {
  const router = useRouter();
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<GarmentPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 1) { setResults([]); setSearched(false); return; }
      setLoading(true);
      setSearched(true);
      try {
        const authParam = teamPin ? `&auth=${teamPin}` : '';
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}${authParam}`);
        const json = await res.json();
        setResults(json.data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [teamPin]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const clearSearch = () => { setQuery(''); setResults([]); setSearched(false); };

  return (
    <div className="space-y-5">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search by Style Ref, Name, Color, Fabric Code, Composition…"
          className="input-field pl-11 pr-10 text-sm"
          style={{ height: '48px', fontSize: '14px' }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--green-primary)' }} />}
          {query && !loading && (
            <button onClick={clearSearch} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {!searched && !query && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-hover)' }}>
              <Search size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Search the collection
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Try searching "REF-", a style name, color, or fabric code
            </p>
          </motion.div>
        )}

        {searched && !loading && results.length === 0 && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No styles found for &ldquo;<strong>{query}</strong>&rdquo;
            </p>
          </motion.div>
        )}

        {results.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            {results.map((g, i) => (
              <motion.button
                key={g.styleRef}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/style/${encodeURIComponent(g.styleRef)}`)}
                className="glass glass-hover w-full text-left p-4 flex items-center gap-4 group"
                style={{ background: 'var(--bg-card)' }}
              >
                {/* Sr# circle */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {g.srNum}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="badge badge-green text-xs">
                      <Tag size={8} /> {g.styleRef}
                    </span>
                    {g.gender && (
                      <span className="badge badge-gray text-xs">
                        <User size={8} /> {g.gender}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {g.style}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {g.colorShade && (
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Palette size={10} /> {g.colorShade}
                      </span>
                    )}
                    {g.composition && (
                      <span className="text-xs flex items-center gap-1 truncate" style={{ color: 'var(--text-muted)', maxWidth: '200px' }}>
                        <Layers size={10} /> {g.composition}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                  className="group-hover:text-green-400 transition-colors" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
