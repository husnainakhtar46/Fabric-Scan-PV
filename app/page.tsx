'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Smartphone, Monitor, Unlock } from 'lucide-react';
import Header from '@/components/Header';
import QrScanner from '@/components/QrScanner';
import SearchDashboard from '@/components/SearchDashboard';

export default function HomePage() {
  const [teamPin, setTeamPin]     = useState<string | null>(null);
  const [isMobile, setIsMobile]   = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'scanner' | 'dashboard'>('scanner');

  useEffect(() => {
    const saved = localStorage.getItem('team_pin');
    if (saved) setTeamPin(saved);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleAuthChange = (pin: string | null) => {
    setTeamPin(pin);
    if (!pin) localStorage.removeItem('team_pin');
  };

  if (isMobile === null) return null;

  return (
    <div className="min-h-screen">
      <Header isTeamView={!!teamPin} onAuthChange={handleAuthChange} />

      {/* ── MOBILE LAYOUT ── */}
      {isMobile && (
        <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
          {/* Tab switcher */}
          <div className="flex rounded-xl p-1 mb-8"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-hover)' }}>
            {[
              { key: 'scanner',   label: 'Scanner',  Icon: QrCode },
              { key: 'dashboard', label: 'Search',   Icon: Smartphone },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'scanner' | 'dashboard')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: activeTab === key ? 'var(--gradient-green)' : 'transparent',
                  color:      activeTab === key ? 'white' : 'var(--text-muted)',
                  boxShadow:  activeTab === key ? 'var(--shadow-green)' : 'none',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'scanner'
              ? <QrScanner />
              : <SearchDashboard teamPin={teamPin} />
            }
          </motion.div>
        </div>
      )}

      {/* ── DESKTOP LAYOUT ── */}
      {!isMobile && (
        <div className="max-w-3xl mx-auto px-8 pt-10 pb-16">

          {/* Team View banner — only visible when unlocked */}
          {teamPin && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6 px-5 py-3 rounded-xl"
              style={{ background: 'rgba(83,166,92,0.1)', border: '1px solid rgba(83,166,92,0.25)' }}
            >
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--green-primary)' }}>
                <Unlock size={14} />
                <span className="font-semibold">Team View active</span>
                <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                  — pricing, notes &amp; event fields are visible
                </span>
              </div>
              <a href="/print" className="btn-primary py-2 px-4 text-xs">
                <QrCode size={12} /> QR Generator
              </a>
            </motion.div>
          )}

          {/* Search panel — full width, generous spacing */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass p-8 md:px-12 md:py-10"
          >
            <div className="flex items-center justify-between mb-7">
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Garment Search
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Search by Style Ref, name, color, fabric code or composition
                </p>
              </div>
              <span className="badge" style={{
                background: teamPin ? 'rgba(83,166,92,0.15)' : 'var(--bg-elevated)',
                color:      teamPin ? 'var(--green-primary)' : 'var(--text-muted)',
                border:     `1px solid ${teamPin ? 'rgba(83,166,92,0.3)' : 'var(--bg-hover)'}`,
              }}>
                <Monitor size={10} />
                {teamPin ? 'Team View' : 'Buyer View'}
              </span>
            </div>

            <SearchDashboard teamPin={teamPin} />
          </motion.div>

          {/* Subtle hint for buyers */}
          {!teamPin && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-xs mt-5"
              style={{ color: 'var(--text-muted)' }}
            >
              Team member? Tap the logo <strong>3×</strong> to unlock Team View with pricing &amp; private notes.
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
}
