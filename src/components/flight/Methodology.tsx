'use client';
import { motion } from 'framer-motion';
import { MethodologyInfo } from '@/lib/types/flight';
import { formatDate } from '@/lib/utils/formatters';


interface MethodologyProps {
  methodology: MethodologyInfo;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
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
      className="space-y-6 max-w-4xl"
    >
      <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold text-text-primary">
        Methodology
      </motion.h2>

      <motion.div variants={fadeUp} className="prose prose-invert max-w-none space-y-4">
        <p className="font-body text-text-secondary leading-relaxed">
          {methodology.description}
        </p>
      </motion.div>

      {/* Key parameters */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <motion.div variants={fadeUp} className="p-6 rounded-lg border border-surface-200 bg-surface-50/40 backdrop-blur-sm">
        <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-2">Data Freshness</p>
        <p className="font-body text-sm text-text-secondary">
          Analysis generated on <span className="font-semibold">{formatDate(methodology.dateOfAnalysis)}</span>
        </p>
        {methodology.benchmarkAvailable && (
          <p className="font-body text-xs text-tier-green mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-tier-green rounded-full" />
            Benchmark data available
          </p>
        )}
      </motion.div>

      {/* Confidence explanation */}
      <motion.div variants={fadeUp} className="space-y-4">
        <h3 className="font-display text-lg font-bold text-text-primary">Confidence Scoring</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ConfidenceLevel
            level="High"
            description="12+ weeks of data, clear trend"
            color="tier-green"
          />
          <ConfidenceLevel
            level="Medium"
            description="8-11 weeks of data, mixed signals"
            color="tier-yellow"
          />
          <ConfidenceLevel
            level="Low"
            description="Less than 8 weeks, high volatility"
            color="tier-red"
          />
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
    <motion.div variants={variants} className="p-4 rounded-lg border border-surface-200 bg-surface-50/40">
      <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-2">
        {label}
      </p>
      <p className="font-display text-2xl font-bold text-accent mb-1">
        {value}
      </p>
      <p className="font-body text-xs text-text-muted">{description}</p>
    </motion.div>
  );
}

function ConfidenceLevel({
  level,
  description,
  color,
}: {
  level: string;
  description: string;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-lg border border-${color}/30 bg-${color}/10 backdrop-blur-sm`}>
      <p className={`font-semibold text-text-${color} mb-1`}>{level}</p>
      <p className="font-body text-xs text-text-muted">{description}</p>
    </div>
  );
}
