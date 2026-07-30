'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Printer, Loader2, AlertCircle, Hash, ChevronRight, Tag, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Header from '@/components/Header';
import type { GarmentPublic } from '@/lib/sheets';

interface PrintItem extends GarmentPublic {
  qrUrl: string;
}

/**
 * Parse Sr# input:
 *   "1,4,5"  → [1,4,5]
 *   "1:8"    → range 1-8
 *   "10:"    → range 10-17 (next 8)
 */
function parseRangeInput(input: string): string {
  return input.trim();
}

export default function PrintPage() {
  const router = useRouter();
  const [teamPin, setTeamPin]     = useState<string | null>(null);
  const [rangeInput, setRangeInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('team_pin');
    if (saved) setTeamPin(saved);
  }, []);
  const [items, setItems]           = useState<PrintItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const printAreaRef                = useRef<HTMLDivElement>(null);

  // Use the configured production URL so QR codes work when scanned by native
  // phone cameras (Chrome/Safari) — not just from within the app.
  // Falls back to window.location.origin for local dev if env var is not set.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    || (typeof window !== 'undefined' ? window.location.origin : '');

  const handleGenerate = async () => {
    if (!rangeInput.trim()) { setError('Please enter a Sr# range.'); return; }
    setError('');
    setLoading(true);
    setItems([]);
    try {
      const authParam = teamPin ? `&auth=${teamPin}` : '';
      const res  = await fetch(`/api/print?range=${encodeURIComponent(parseRangeInput(rangeInput))}${authParam}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to fetch styles.'); return; }
      const data: GarmentPublic[] = json.data;
      if (data.length === 0) { setError('No styles found for that range.'); return; }
      setItems(data.map((g) => ({
        ...g,
        qrUrl: `${baseUrl}/style/${encodeURIComponent(g.formNo)}`,
      })));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleAuthChange = (pin: string | null) => {
    setTeamPin(pin);
    if (!pin) localStorage.removeItem('team_pin');
  };

  // Split into pages of 8
  const pages: PrintItem[][] = [];
  for (let i = 0; i < items.length; i += 8) pages.push(items.slice(i, i + 8));

  return (
    <div className="min-h-screen">
      <Header isTeamView={!!teamPin} onAuthChange={handleAuthChange} />

      {/* ── Screen UI ── */}
      <div className="no-print max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="btn-ghost py-2 px-3 text-sm mb-6"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>

          {/* Page title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--gradient-green)', boxShadow: 'var(--shadow-green)' }}>
                <QrCode size={20} color="white" />
              </div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                QR Code Generator
              </h1>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Generate print-ready A4 sheets with 8 QR codes per page
            </p>
          </div>

          {/* Input card */}
          <div className="glass p-6 mb-6">
            <p className="label mb-3">Enter Sr# Range</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="glass p-3 text-center" style={{ borderColor: 'var(--bg-hover)' }}>
                <p className="font-mono text-sm font-bold" style={{ color: 'var(--green-primary)' }}>1,4,5,6</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Specific Sr#s</p>
              </div>
              <div className="glass p-3 text-center" style={{ borderColor: 'var(--bg-hover)' }}>
                <p className="font-mono text-sm font-bold" style={{ color: 'var(--green-primary)' }}>1:8</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Range (inclusive)</p>
              </div>
              <div className="glass p-3 text-center" style={{ borderColor: 'var(--bg-hover)' }}>
                <p className="font-mono text-sm font-bold" style={{ color: 'var(--green-primary)' }}>10:</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>All from #10</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g. 1:8 or 1,3,5"
                  className="input-field pl-9"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary flex-shrink-0"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                {loading ? 'Loading…' : 'Generate'}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs mt-3"
                  style={{ color: 'var(--red-accent)' }}
                >
                  <AlertCircle size={12} /> {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Preview grid */}
          {items.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {items.length} QR code{items.length !== 1 ? 's' : ''} ready
                  <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    ({pages.length} A4 page{pages.length !== 1 ? 's' : ''})
                  </span>
                </p>
                <button onClick={handlePrint} className="btn-primary">
                  <Printer size={14} /> Print Now
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {items.map((item) => (
                  <div key={item.formNo}
                    className="glass p-3 flex flex-col items-center gap-2 text-center">
                    <div className="bg-white p-2 rounded-lg">
                      <QRCodeSVG
                        value={item.qrUrl}
                        size={100}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#0d1117"
                      />
                    </div>
                    <span className="badge badge-green text-xs">
                      <Tag size={8} /> {item.formNo}
                    </span>
                    <p className="text-xs truncate w-full" style={{ color: 'var(--text-muted)' }}>
                      {item.style}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ── PRINT AREA (hidden on screen, shown on print) ── */}
      <div ref={printAreaRef} className="print-only" style={{ display: 'none' }}>
        {pages.map((page, pi) => (
          <div key={pi} className="qr-print-grid" style={{ pageBreakAfter: pi < pages.length - 1 ? 'always' : 'auto' }}>
            {page.map((item) => (
              <div key={item.formNo} className="qr-print-item">
                <QRCodeSVG
                  value={item.qrUrl}
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
                <div className="qr-print-label">
                  <div className="style-ref">{item.formNo}</div>
                  <div className="style-name">{item.style} · {item.colorShade}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
