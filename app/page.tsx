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
          <div className="flex justify-center mb-8" style={{ marginTop: '1.25rem' }}>
            <div
              className="flex p-1 gap-1"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-hover)', borderRadius: '50px' }}
            >
              {[
                { key: 'scanner',   label: 'Scanner',  Icon: QrCode },
                { key: 'dashboard', label: 'Search',   Icon: Smartphone },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'scanner' | 'dashboard')}
                  className="flex items-center gap-2 text-sm font-medium transition-all"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '50px',
                    background: activeTab === key ? 'var(--gradient-green)' : 'transparent',
                    color:      activeTab === key ? 'white' : 'var(--text-muted)',
                    boxShadow:  activeTab === key ? 'var(--shadow-green)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ marginTop: '1.25rem' }}
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
        <div className="mx-auto px-8 pt-10 pb-16" style={{ maxWidth: '1024px' }}>

          {/* Team View QR Generator */}
          {teamPin && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end mt-4 mb-6"
            >
              <a href="/print" className="btn-primary py-2 px-4 text-xs">
                <QrCode size={12} /> QR Generator
              </a>
            </motion.div>
          )}

          {/* Tab switcher */}
          <div className="flex justify-center" style={{ marginTop: '1.5rem' }}>
            <div
              className="flex p-1 gap-1"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-hover)', borderRadius: '50px' }}
            >
              {[
                { key: 'scanner',   label: 'QR Scanner', Icon: QrCode },
                { key: 'dashboard', label: 'Search',      Icon: Monitor },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'scanner' | 'dashboard')}
                  className="flex items-center gap-2 text-sm font-medium transition-all"
                  style={{
                    padding: '9px 24px',
                    borderRadius: '50px',
                    background: activeTab === key ? 'var(--gradient-green)' : 'transparent',
                    color:      activeTab === key ? 'white' : 'var(--text-muted)',
                    boxShadow:  activeTab === key ? 'var(--shadow-green)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ marginTop: '1.25rem' }}
          >
            {activeTab === 'scanner' ? (
              <div className="glass" style={{ padding: '2rem 10%' }}>
                <QrScanner />
              </div>
            ) : (
              <div className="glass" style={{ padding: '2rem 10%' }}>
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
              </div>
            )}
          </motion.div>

        </div>
      )}

    </div>
  );
}
