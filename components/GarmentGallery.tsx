'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

interface GarmentGalleryProps {
  articleCode: string;
}

export default function GarmentGallery({ articleCode }: GarmentGalleryProps) {
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [probing, setProbing]     = useState(true);
  const [lightbox, setLightbox]   = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setConfirmed([]);
    setProbing(true);
    let cancelled = false;
    async function probe() {
      const found: string[] = [];
      for (let i = 1; i <= MAX_IMAGES; i++) {
        if (cancelled) break;
        const publicId = `${articleCode}_${i}`;
        const ok = await checkImageExists(thumbUrl(publicId));
        if (!ok) break;
        found.push(publicId);
      }
      if (!cancelled) { setConfirmed(found); setProbing(false); }
    }
    probe();
    return () => { cancelled = true; };
  }, [articleCode]);

  const prev = useCallback(() => setLightbox(i => (i !== null ? Math.max(0, i - 1) : null)), []);
  const next = useCallback(() => setLightbox(i => (i !== null ? Math.min(confirmed.length - 1, i + 1) : null)), [confirmed.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightbox === null) return;
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape')     setLightbox(null);
  }, [lightbox, prev, next]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50)  prev();
    if (delta < -50) next();
    touchStartX.current = null;
  };

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
              className="flex-shrink-0 relative overflow-hidden"
              style={{ width: 110, height: 110, borderRadius: '1rem', border: '1px solid var(--bg-hover)', background: 'var(--bg-elevated)' }}
            >
              <Image src={thumbUrl(publicId)} alt={`${articleCode} photo ${idx + 1}`} fill sizes="110px" className="object-cover" style={{ borderRadius: '1rem' }} />
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' }}
            onClick={() => setLightbox(null)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            {lightbox > 0 && (
              <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-3 z-10 flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', cursor: 'pointer' }}>
                <ChevronLeft size={22} />
              </button>
            )}
            {lightbox < confirmed.length - 1 && (
              <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-3 z-10 flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', cursor: 'pointer' }}>
                <ChevronRight size={22} />
              </button>
            )}
            <motion.div
              key={lightbox}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '92vw', maxHeight: '82vh', width: '100%', aspectRatio: '1/1', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.6)', position: 'relative' }}
            >
              <Image src={fullUrl(confirmed[lightbox])} alt={`${articleCode} photo ${lightbox + 1}`} fill sizes="92vw" className="object-contain" priority />
            </motion.div>
            {confirmed.length > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {confirmed.map((_, i) => (
                  <button key={i} onClick={e => { e.stopPropagation(); setLightbox(i); }}
                    style={{ width: i === lightbox ? 20 : 8, height: 8, borderRadius: 4, background: i === lightbox ? 'var(--green-primary)' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s', border: 'none', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
