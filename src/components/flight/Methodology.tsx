'use client';
import { motion } from 'framer-motion';
import { MethodologyInfo } from '@/lib/types/flight';
import { formatDate } from '@/lib/utils/formatters';

interface MethodologyProps {
  methodology: MethodologyInfo;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0 },
  },
};

export function Methodology({ methodology }: MethodologyProps) {

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8"
    >
      <motion.h2 variants={fadeUp} className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
        Methodology
      </motion.h2>

      <motion.p variants={fadeUp} className="font-body text-text-muted text-[15px] leading-relaxed font-light max-w-3xl">
        {methodology.description}
      </motion.p>

      {/* Key parameters */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ParameterCard
          label="Velocity Weight"
          value={`${(methodology.velocityWeight * 100).toFixed(0)}%`}
          description="Historical ticket sales velocity"
          variants={fadeUp}
        />
        <ParameterCard
          label="Multiplier Weight"
          value={`${(methodology.multiplierWeight * 100).toFixed(0)}%`}
          description="Day-out surge multiplier effect"
          variants={fadeUp}
        />
        <ParameterCard
          label="Surge Multiplier"
          value={`${methodology.surgeMultiplier.toFixed(1)}x`}
          description="Applied in final weeks"
          variants={fadeUp}
        />
        <ParameterCard
          label="Data Snapshots"
          value={methodology.snapshotCount}
          description="Historical pacing data points"
          variants={fadeUp}
        />
      </motion.div>

      {/* Data freshness */}
      <motion.div variants={fadeUp} className="p-5 rounded-xl border border-surface-200 bg-surface-50/60">
        <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-2">Data Freshness</p>
        <p className="font-body text-[14px] text-text-secondary">
          Analysis generated on <span className="font-medium text-text-primary">{formatDate(methodology.dateOfAnalysis)}</span>
        </p>
        {methodology.benchmarkAvailable && (
          <p className="font-body text-[13px] text-text-muted mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-text-secondary rounded-full" />
            Benchmark data available
          </p>
        )}
      </motion.div>

      {/* Confidence explanation */}
      <motion.div variants={fadeUp} className="space-y-4">
        <h3 className="font-heading text-lg font-bold text-text-primary">Confidence Scoring</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/60">
            <p className="font-medium text-text-primary text-[14px] mb-1">High</p>
            <p className="font-body text-[13px] text-text-muted">12+ weeks of data, clear trend</p>
          </div>
          <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/60">
            <p className="font-medium text-text-primary text-[14px] mb-1">Medium</p>
            <p className="font-body text-[13px] text-text-muted">8-11 weeks of data, mixed signals</p>
          </div>
          <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/60">
            <p className="font-medium text-text-primary text-[14px] mb-1">Low</p>
            <p className="font-body text-[13px] text-text-muted">Less than 8 weeks, high volatility</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ParameterCard({
  label,
  value,
  description,
  variants,
}: {
  label: string;
  value: string | number;
  description: string;
  variants: any;
}) {
  return (
    <motion.div variants={variants} className="p-4 rounded-xl border border-surface-200 bg-surface-50/60">
      <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-2">
        {label}
      </p>
      <p className="font-heading text-2xl font-bold text-text-primary mb-1">
        {value}
      </p>
      <p className="font-body text-[12px] text-text-muted">{description}</p>
    </motion.div>
  );
}
