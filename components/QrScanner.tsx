'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, QrCode, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QrScanner() {
  const router   = useRouter();
  const ref      = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      try {
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => {});
        }
      } catch (e) {
        // ignore synchronous errors from html5-qrcode
      }
    };
  }, []);

  const startScanner = async () => {
    setStatus('starting');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          // Extract Style Ref from URL or use raw value
          let articleCode = decodedText;
          try {
            const url = new URL(decodedText);
            const parts = url.pathname.split('/');
            const idx = parts.indexOf('article');
            if (idx !== -1 && parts[idx + 1]) {
              articleCode = decodeURIComponent(parts[idx + 1]);
            }
          } catch {
            // Not a URL — use raw text as style ref
          }
          try {
            scanner.stop().catch(() => {});
          } catch (e) {
            // ignore
          }
          router.push(`/article/${encodeURIComponent(articleCode)}`);
        },
        () => {} // on frame error — silent
      );
      setStatus('scanning');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setErrorMsg(msg.includes('Permission') ? 'Camera permission denied.' : 'Could not start camera.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Scanner area */}
      <div className="relative w-full max-w-sm">
        <div
          id="qr-reader"
          ref={ref}
          className="scanner-overlay w-full bg-[var(--bg-elevated)] rounded-2xl overflow-hidden"
          style={{ minHeight: status === 'idle' ? 0 : '300px' }}
        />

        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 px-6 gap-5
              rounded-2xl w-full"
            style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--bg-hover)' }}
          >
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse-green"
              style={{ background: 'rgba(83,166,92,0.12)', border: '1px solid rgba(83,166,92,0.3)' }}>
              <QrCode size={36} style={{ color: 'var(--green-primary)' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                QR Code Scanner
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Tap below to start camera and scan a garment tag
              </p>
            </div>
          </motion.div>
        )}

        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            {[
              'top-4 left-4 border-t-2 border-l-2 rounded-tl-lg',
              'top-4 right-4 border-t-2 border-r-2 rounded-tr-lg',
              'bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg',
              'bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-6 h-6 ${cls}`}
                style={{ borderColor: 'var(--green-primary)' }} />
            ))}
          </div>
        )}
      </div>

      {/* Status message */}
      {status === 'scanning' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 badge badge-green"
        >
          <Zap size={12} className="animate-pulse" />
          Scanning… point at a QR code
        </motion.div>
      )}

      {status === 'error' && (
        <p className="text-sm text-center" style={{ color: 'var(--red-accent)' }}>
          {errorMsg}
        </p>
      )}

      {status !== 'scanning' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={startScanner}
          className="btn-primary"
          disabled={status === 'starting'}
        >
          <Camera size={16} />
          {status === 'starting' ? 'Starting camera…' : status === 'error' ? 'Try Again' : 'Start Scanning'}
        </motion.button>
      )}
    </div>
  );
}
