'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import GarmentCard from '@/components/GarmentCard';
import type { GarmentPublic, GarmentFull } from '@/lib/sheets';

export default function StylePage() {
  const params = useParams();
  const articleCode = decodeURIComponent(params.articleCode as string);

  const [garment, setGarment]   = useState<GarmentPublic | GarmentFull | null>(null);
  const [isTeamView, setIsTeamView] = useState(false);
  const [teamPin, setTeamPin]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const fetchGarment = useCallback(async (pin: string | null) => {
    setLoading(true);
    setError('');
    try {
      const authParam = pin ? `&auth=${pin}` : '';
      const res = await fetch(`/api/article?articleCode=${encodeURIComponent(articleCode)}${authParam}`);
      if (!res.ok) {
        const j = await res.json();
        setError(j.error || 'Style not found');
        setLoading(false);
        return;
      }
      const json = await res.json();
      setGarment(json.data);
      setIsTeamView(json.isTeamView);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [articleCode]);

  useEffect(() => {
    const saved = localStorage.getItem('team_pin');
    setTeamPin(saved);
    fetchGarment(saved);
  }, [fetchGarment]);

  const handleAuthChange = (pin: string | null) => {
    setTeamPin(pin);
    if (!pin) localStorage.removeItem('team_pin');
    fetchGarment(pin); // Re-fetch with new auth
  };

  return (
    <div className="min-h-screen">
      <Header isTeamView={isTeamView} onAuthChange={handleAuthChange} />

      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={32} style={{ color: 'var(--green-primary)' }} />
          </motion.div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading garment data…
          </p>
        </div>
      )}

      {!loading && error && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto px-4 pt-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.3)' }}>
            <AlertCircle size={28} style={{ color: 'var(--red-accent)' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Style Not Found
          </h2>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{error}</p>
          <p className="text-xs font-mono mb-6 badge badge-gray mx-auto w-fit">{articleCode}</p>
          <a href="/" className="btn-primary mx-auto w-fit">← Back to Search</a>
        </motion.div>
      )}

      {!loading && !error && garment && (
        <GarmentCard garment={garment} isTeamView={isTeamView} />
      )}
    </div>
  );
}
