'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, X, Eye, EyeOff } from 'lucide-react';

interface HeaderProps {
  isTeamView: boolean;
  onAuthChange: (pin: string | null) => void;
}

export default function Header({ isTeamView, onAuthChange }: HeaderProps) {
  const router = useRouter();
  const tapTimestamps = useRef<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  // ── 3-tap secret unlock on logo ──────────────────────────
  const handleLogoTap = useCallback(() => {
    if (isTeamView) {
      // Already unlocked — tap logo to lock
      onAuthChange(null);
      localStorage.removeItem('team_pin');
      return;
    }
    const now = Date.now();
    tapTimestamps.current = [...tapTimestamps.current, now].filter(
      (t) => now - t < 2000
    );
    if (tapTimestamps.current.length >= 3) {
      tapTimestamps.current = [];
      setShowModal(true);
    }
  }, [isTeamView, onAuthChange]);

  const handleSubmitPin = async () => {
    setError('');
    const res = await fetch(`/api/style?styleRef=REF-000ALY&auth=${pin}`);
    if (res.ok) {
      const json = await res.json();
      if (json.isTeamView) {
        localStorage.setItem('team_pin', pin);
        onAuthChange(pin);
        setShowModal(false);
        setPin('');
      } else {
        triggerError('Incorrect PIN. Try again.');
      }
    } else {
      triggerError('Incorrect PIN. Try again.');
    }
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  return (
    <>
      <header className="no-print sticky top-0 z-50 glass border-b border-[var(--glass-border)]"
        style={{ borderRadius: 0, backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo — tap 3x to unlock */}
          <button
            onClick={handleLogoTap}
            className="flex items-center gap-3 select-none cursor-pointer group"
            style={{ background: 'none', border: 'none', padding: 0 }}
            title={isTeamView ? 'Click to lock Team View' : ''}
          >
            {/* Softwood Logo */}
            <img src="/logo.svg" alt="Logo" width="36" height="36" style={{ objectFit: 'contain', userSelect: 'none' }} />
            <div className="text-left">
              <div className="font-outfit font-700 text-sm leading-tight"
                style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--text-primary)' }}>
                SOFTWOOD PVT LTD
              </div>
            </div>
          </button>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isTeamView && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="badge badge-green flex items-center gap-1"
              >
                <Unlock size={10} />
                Team View
              </motion.div>
            )}

            <nav className="hidden md:flex items-center gap-2">
              <button onClick={() => router.push('/')} className="btn-ghost py-2 px-3 text-sm">
                Dashboard
              </button>
              {isTeamView && (
                <button onClick={() => router.push('/print')} className="btn-ghost py-2 px-3 text-sm">
                  QR Generator
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* PIN Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setPin(''); setError(''); } }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`glass w-full max-w-sm p-6 ${shaking ? 'animate-shake' : ''}`}
              style={{ border: '1px solid var(--glass-border-hover)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(83,166,92,0.15)', border: '1px solid var(--glass-border-hover)' }}>
                    <Lock size={18} style={{ color: 'var(--green-primary)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                      Team Access
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Enter PIN to unlock private fields</p>
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); setPin(''); setError(''); }}
                  className="btn-ghost p-2 rounded-lg" style={{ padding: '6px' }}>
                  <X size={16} />
                </button>
              </div>

              {/* PIN Input */}
              <div className="relative mb-4">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitPin()}
                  placeholder="Enter team PIN"
                  autoFocus
                  className="input-field pr-10"
                  style={{ letterSpacing: pin && !showPin ? '4px' : '0' }}
                />
                <button
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs mb-3"
                  style={{ color: 'var(--red-accent)' }}>
                  {error}
                </motion.p>
              )}

              <button onClick={handleSubmitPin} className="btn-primary w-full justify-center">
                <Unlock size={14} />
                Unlock Team View
              </button>

              <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
                Reveals fabric pricing, notes and event info
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </>
  );
}
