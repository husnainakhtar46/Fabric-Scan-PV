'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const MAX_IMAGES = 5;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'zup1wjzz';

function thumbUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_300,h_300,c_fill,q_60,f_auto/${publicId}`;
}
function fullUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1200,q_75,f_auto/${publicId}`;
}
function checkImageExists(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload  = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// ── Lightbox rendered via Portal so it escapes any parent transform/overflow ──
interface LightboxProps {
  confirmed: string[];
  lightbox: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (i: number) => void;
  articleCode: string;
}

function Lightbox({ confirmed, lightbox, onClose, onPrev, onNext, onGoTo, articleCode }: LightboxProps) {
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50)  onPrev();
    if (delta < -50) onNext();
    touchStartX.current = null;
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', color: 'white',
          border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={20} />
      </button>

      {/* Prev */}
      {lightbox > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          style={{
            position: 'absolute', left: 12, zIndex: 10,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', color: 'white',
            border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next */}
      {lightbox < confirmed.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          style={{
            position: 'absolute', right: 12, zIndex: 10,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', color: 'white',
            border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Image */}
      <motion.div
        key={lightbox}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '90vw', height: '80vh',
          maxWidth: 900,
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,0.7)',
        }}
      >
        <Image
          src={fullUrl(confirmed[lightbox])}
          alt={`${articleCode} photo ${lightbox + 1}`}
          fill
          sizes="90vw"
          style={{ objectFit: 'contain' }}
          priority
          unoptimized
        />
      </motion.div>

      {/* Dot indicators */}
      {confirmed.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 20,
          left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8,
        }}>
          {confirmed.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); onGoTo(i); }}
              style={{
                width: i === lightbox ? 22 : 8, height: 8,
                borderRadius: 4,
                background: i === lightbox ? 'var(--green-primary)' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.25s', border: 'none', cursor: 'pointer', padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );

  return createPortal(content, document.body);
}

// ── Main gallery component ────────────────────────────────────────────────────
interface GarmentGalleryProps {
  articleCode: string;
}

export default function GarmentGallery({ articleCode }: GarmentGalleryProps) {
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [probing, setProbing]     = useState(true);
  const [lightbox, setLightbox]   = useState<number | null>(null);
  const [mounted, setMounted]     = useState(false);  // guard portal SSR

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setConfirmed([]); setProbing(true);
    let cancelled = false;
    async function probe() {
      const found: string[] = [];
      for (let i = 1; i <= MAX_IMAGES; i++) {
        if (cancelled) break;
        const publicId = `${articleCode}_${i}`;
        if (!(await checkImageExists(thumbUrl(publicId)))) break;
        found.push(publicId);
      }
      if (!cancelled) { setConfirmed(found); setProbing(false); }
    }
    probe();
    return () => { cancelled = true; };
  }, [articleCode]);

  const prev   = useCallback(() => setLightbox(i => (i !== null ? Math.max(0, i - 1) : null)), []);
  const next   = useCallback(() => setLightbox(i => (i !== null ? Math.min(confirmed.length - 1, i + 1) : null)), [confirmed.length]);
  const close  = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox === null) return;
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, prev, next, close]);

  // Prevent page scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  if (probing || confirmed.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-2xl mx-auto px-4"
        style={{ marginBottom: '1rem' }}
      >
        <p className="label px-1 mb-2" style={{ color: 'var(--text-muted)' }}>Photos</p>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {confirmed.map((publicId, idx) => (
            <motion.button
              key={publicId}
              onClick={() => setLightbox(idx)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                flexShrink: 0, position: 'relative',
                width: 110, height: 110,
                borderRadius: '1rem',
                border: '1px solid var(--bg-hover)',
                background: 'var(--bg-elevated)',
                overflow: 'hidden', cursor: 'pointer',
                padding: 0,
              }}
            >
              <Image
                src={thumbUrl(publicId)}
                alt={`${articleCode} photo ${idx + 1}`}
                fill sizes="110px"
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Portal-based lightbox — fully escapes parent transforms */}
      {mounted && (
        <AnimatePresence>
          {lightbox !== null && (
            <Lightbox
              confirmed={confirmed}
              lightbox={lightbox}
              articleCode={articleCode}
              onClose={close}
              onPrev={prev}
              onNext={next}
              onGoTo={setLightbox}
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
}
