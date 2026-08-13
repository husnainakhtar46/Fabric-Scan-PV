'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Printer, Loader2, AlertCircle, Hash, ChevronRight, Tag, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import ExcelJS from 'exceljs';
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
        qrUrl: `${baseUrl}/article/${encodeURIComponent(g.articleCode)}`,
      })));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleExportExcel = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('QR Stickers');

      // Set column widths (roughly 2.5 inches)
      // Excel column width units are roughly number of characters. 25 is a good start.
      worksheet.columns = [
        { width: 35 },
        { width: 35 },
        { width: 35 }
      ];

      const canvases = document.querySelectorAll<HTMLCanvasElement>('[data-export-canvas] canvas');
      const qrDataUrls: Record<string, string> = {};
      items.forEach((item, i) => {
        const c = canvases[i];
        if (c) qrDataUrls[item.articleCode] = c.toDataURL('image/png');
      });

      let currentRow = 1;
      
      for (let i = 0; i < items.length; i += 3) {
        // Set row height (roughly 3.5 inches -> ~250 points)
        worksheet.getRow(currentRow).height = 200;

        for (let j = 0; j < 3; j++) {
          const itemIndex = i + j;
          if (itemIndex >= items.length) break;
          
          const item = items[itemIndex];
          const col = j + 1;

          // Add image
          if (qrDataUrls[item.articleCode]) {
            const imageId = workbook.addImage({
              base64: qrDataUrls[item.articleCode],
              extension: 'png',
            });
            
          // Add image to cell (centered horizontally, top vertically)
            // col and row are 0-indexed in ext, but 1-indexed in getCell
            worksheet.addImage(imageId, {
              tl: { col: col - 1 + 0.1, row: currentRow - 1 + 0.1 },
              ext: { width: 150, height: 150 }
            });
          }

          // Add text below image (sits at the bottom of the cell)
          const cell = worksheet.getCell(currentRow, col);
          
          cell.value = {
            richText: [
              { text: `${item.articleCode}\n`, font: { name: 'Arial', size: 16, bold: true, color: { argb: 'FF000000' } } },
              { text: `${item.style} · ${item.colorShade}`, font: { name: 'Arial', size: 11, color: { argb: 'FF444444' } } }
            ]
          };
          
          // Align at the very bottom so it stays under the QR code
          cell.alignment = { horizontal: 'center', vertical: 'bottom', wrapText: true };
        }
        currentRow++;
      }

      // Generate file and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_Stickers_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Excel', err);
      setError('Failed to generate Excel file');
    } finally {
      setLoading(false);
    }
  };

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
                <div className="flex gap-2">
                  <button onClick={handlePrint} className="btn-primary">
                    <Printer size={14} /> Print Now
                  </button>
                  <button onClick={handleExportExcel} disabled={loading} className="btn-primary" style={{ background: 'var(--blue-accent)', borderColor: 'var(--blue-accent)' }}>
                    Export Excel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {items.map((item) => (
                  <div key={item.articleCode}
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
                      <Tag size={8} /> {item.articleCode}
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

      {/* Hidden canvases used by Excel export to extract QR data URLs */}
      {items.length > 0 && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
          {items.map((item) => (
            <div key={item.articleCode} data-export-canvas="true">
              <QRCodeCanvas value={item.qrUrl} size={160} level="M" bgColor="#ffffff" fgColor="#000000" />
            </div>
          ))}
        </div>
      )}

      {/* ── PRINT AREA (hidden on screen, shown on print) ── */}
      <div ref={printAreaRef} className="print-only" style={{ display: 'none' }}>
        {pages.map((page, pi) => (
          <div key={pi} className="qr-print-grid" style={{ pageBreakAfter: pi < pages.length - 1 ? 'always' : 'auto' }}>
            {page.map((item) => (
              <div key={item.articleCode} className="qr-print-item">
                <QRCodeSVG
                  value={item.qrUrl}
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
                <div className="qr-print-label">
                  <div className="style-ref">{item.articleCode}</div>
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
