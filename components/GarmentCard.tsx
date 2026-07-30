'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft, Tag, Palette, Scale, Droplets, Layers, Repeat, Hash,
  Ruler, User, DollarSign, StickyNote, Calendar, ShieldCheck, ShieldOff,
  Shirt, Scissors, Waves, Package, MapPin, FlaskConical, Wind, Briefcase, Factory, PieChart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { GarmentPublic, GarmentFull } from '@/lib/sheets';

interface GarmentCardProps {
  garment: GarmentPublic | GarmentFull;
  isTeamView: boolean;
}

function isFullGarment(g: GarmentPublic | GarmentFull): g is GarmentFull {
  return 'fabricPrice' in g;
}

function Field({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode; accent?: boolean;
}) {
  if (!value || value === '' || value === '0') return null;
  return (
    <div className="field-cell">
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: accent ? 'var(--green-primary)' : 'var(--text-muted)' }}>
          {icon}
        </span>
        <span className="label">{label}</span>
      </div>
      <p className="value" style={{ color: accent ? 'var(--green-primary)' : 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  },
};

export default function GarmentCard({ garment, isTeamView }: GarmentCardProps) {
  const router = useRouter();
  const full   = isFullGarment(garment) ? garment : null;

  const genderColor = garment.gender?.toLowerCase() === 'female'
    ? 'var(--red-accent)'
    : 'var(--green-primary)';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto px-4 py-6 space-y-4"
    >
      {/* Back button */}
      <motion.button
        variants={itemVariants}
        onClick={() => router.back()}
        className="btn-ghost py-2 px-3 text-sm"
        style={{ marginTop: '1rem', marginBottom: '0.5rem', display: 'inline-flex' }}
      >
        <ArrowLeft size={14} /> Back
      </motion.button>

      {/* Hero Card */}
      <motion.div variants={itemVariants} className="glass p-5 relative overflow-hidden">
        {/* Subtle green glow top-right */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(83,166,92,0.12) 0%, transparent 70%)' }} />

        {/* Article Code (formNo) badge row */}
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-green">
                <Tag size={9} />
                {garment.formNo}
              </span>
              {garment.srNum && (
                <span className="badge badge-gray">Sr# {garment.srNum}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold mt-1"
              style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
              {garment.style || '—'}
            </h1>
          </div>

          {/* Team view indicator */}
          <div className={`badge ${isTeamView ? 'badge-green' : 'badge-gray'} flex items-center gap-1`}>
            {isTeamView ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
            {isTeamView ? 'Team View' : 'Buyer View'}
          </div>
        </div>

        {/* Color + Gender + Fit row */}
        <div className="flex flex-wrap gap-2">
          {garment.colorShade && (
            <span className="badge badge-gray">
              <Palette size={9} /> {garment.colorShade}
            </span>
          )}
          {garment.gender && (
            <span className="badge" style={{
              background: `${genderColor}20`,
              color: genderColor,
              border: `1px solid ${genderColor}50`,
            }}>
              <User size={9} /> {garment.gender}
            </span>
          )}
          {garment.fit && (
            <span className="badge badge-gray">
              <Shirt size={9} /> {garment.fit}
            </span>
          )}
        </div>
      </motion.div>

      {/* Public Details Section (Buyer-visible) */}
      <motion.div variants={itemVariants}>
        <p className="label px-1 mb-2" style={{ color: 'var(--text-muted)' }}>Fabric Details</p>
        <div className="field-grid">
          <Field label="Article Code"     value={garment.formNo}         icon={<Hash size={11} />} />
          <Field label="Style"            value={garment.style}          icon={<Tag size={11} />} />
          <Field label="Color / Shade"    value={garment.colorShade}     icon={<Palette size={11} />} />
          <Field label="B1 Fabric Code"   value={garment.b1FabricCode}   icon={<Hash size={11} />} />
          <Field label="Composition"      value={garment.composition}    icon={<Layers size={11} />} />
          <Field label="Weave / Fabric"   value={garment.weave}          icon={<Scissors size={11} />} />
          <Field label="Weight (AW)"      value={garment.weightAw}       icon={<Scale size={11} />} />
          <Field label="Colors in Family" value={garment.colorsInFamily} icon={<Palette size={11} />} />
          <Field label="No. of Washes"    value={garment.numWashes}      icon={<Repeat size={11} />} />
          <Field label="Gender"           value={garment.gender}         icon={<User size={11} />} />
          <Field label="Fit"              value={garment.fit}            icon={<Shirt size={11} />} />
        </div>
      </motion.div>

      {/* Private Fields (Team View only) */}
      {isTeamView && full && (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2 px-1">
            <p className="label" style={{ color: 'var(--green-primary)' }}>Private — Team Only</p>
            <span className="badge badge-green"><ShieldCheck size={9} /> Verified</span>
          </div>
          <div className="glass p-1" style={{ border: '1px solid rgba(83,166,92,0.3)' }}>
            <div className="field-grid" style={{ borderRadius: 'calc(var(--radius-md) - 4px)', overflow: 'hidden' }}>

              {/* 1. Fabric Code */}
              <Field label="Fabric Code"          value={full.fabricCode}       icon={<Hash size={11} />} />

              {/* 2. Shrinkage Warp */}
              <Field label="Shrinkage Warp"        value={full.shrinkageWarp}    icon={<Droplets size={11} />} />

              {/* 3. Shrinkage Weft */}
              <Field label="Shrinkage Weft"        value={full.shrinkageWeft}    icon={<Droplets size={11} />} />

              {/* 4. Stretch & Recovery */}
              <Field label="Stretch & Recovery"    value={full.stretchRecovery}  icon={<Wind size={11} />} />

              {/* 5. Fabric Cuttable Width */}
              <Field label="Fabric Cuttable Width" value={full.fabricWidth}      icon={<Ruler size={11} />} />

              {/* 6. Fabric Price */}
              {full.fabricPrice && (
                <div className="field-cell">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign size={11} style={{ color: 'var(--green-primary)' }} />
                    <span className="label">Fabric Price</span>
                  </div>
                  <p className="value text-lg font-bold" style={{ color: 'var(--green-primary)' }}>
                    ${full.fabricPrice}
                  </p>
                </div>
              )}

              {/* 7. Suppliers and Customers */}
              <Field label="Customer"              value={full.customer}         icon={<Briefcase size={11} />} />
              <Field label="Garment Supplier"      value={full.garmentSupplier}  icon={<Factory size={11} />} />
              <Field label="Fabric Supplier"       value={full.fabricSupplier}   icon={<Package size={11} />} />

              {/* 8. Idea Garment Price */}
              {full.ideaGarmentPrice && (
                <div className="field-cell">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign size={11} style={{ color: 'var(--green-primary)' }} />
                    <span className="label">Idea Garment Price</span>
                  </div>
                  <p className="value text-lg font-bold" style={{ color: 'var(--green-primary)' }}>
                    ${full.ideaGarmentPrice}
                  </p>
                </div>
              )}

              {/* Garment Fabric Consumption */}
              <Field label="Garment Fabric Consumption" value={full.garmentFabricConsumption} icon={<PieChart size={11} />} />

              {/* 9. Target Season */}
              <Field label="Target Season"         value={full.targetSeason}     icon={<Calendar size={11} />} />

              {/* 10. Fabric MOQ */}
              <Field label="Fabric MOQ"            value={full.fabricMoq}        icon={<FlaskConical size={11} />} />

              {/* 11. Physical Sample Location — wide */}
              {full.sampleLocation && (
                <div className="field-cell" style={{ gridColumn: '1 / -1' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                    <span className="label">Physical Sample Location</span>
                  </div>
                  <p className="value">{full.sampleLocation}</p>
                </div>
              )}

              {/* 12. Event — wide */}
              {full.event && (
                <div className="field-cell" style={{ gridColumn: '1 / -1' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar size={11} style={{ color: 'var(--red-accent)' }} />
                    <span className="label">Event</span>
                  </div>
                  <p className="value">{full.event}</p>
                </div>
              )}

              {/* 13. Notes — wide */}
              {full.notes && (
                <div className="field-cell" style={{ gridColumn: '1 / -1' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <StickyNote size={11} style={{ color: 'var(--text-muted)' }} />
                    <span className="label">Notes</span>
                  </div>
                  <p className="value">{full.notes}</p>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      )}

      {/* Locked hint for buyer view */}
      {!isTeamView && (
        <motion.div variants={itemVariants}
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--bg-hover)', marginTop: '1rem', marginBottom: '1rem' }}>
          <ShieldOff size={14} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Team View Only
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
