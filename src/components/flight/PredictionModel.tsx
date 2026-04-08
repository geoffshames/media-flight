'use client';
import { motion } from 'framer-motion';
import { Market } from '@/lib/types/flight';
import { formatPct, tierAccentColor } from '@/lib/utils/formatters';

interface PredictionModelProps {
  markets: Market[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0 },
  },
};

export function PredictionModel({ markets }: PredictionModelProps) {

  const riskMarkets = markets.filter(
    (m) => m.prediction.tier !== 'green_sold_out' && m.prediction.tier !== 'green_on_pace'
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6"
    >
      <motion.h2 variants={fadeUp} className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
        Predictions
      </motion.h2>

      <motion.p variants={fadeUp} className="font-body text-text-muted text-[15px] max-w-2xl font-light">
        Current vs. predicted sell-through based on velocity trends and historical day-out multipliers.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskMarkets.map((market, idx) => (
          <PredictionCard key={`${market.city}-${market.showDate}`} market={market} delay={idx * 0.05} />
        ))}
      </div>
    </motion.div>
  );
}

function PredictionCard({ market, delay }: { market: Market; delay: number }) {
  const currentPct = market.pctSold * 100;
  const predictedPct = market.prediction.blendedPredPct * 100;
  const accentColor = tierAccentColor(market.prediction.tier);

  const getTrendArrow = (trend: string) => {
    switch (trend) {
      case 'accelerating': return '↗';
      case 'steady': return '→';
      case 'decelerating': return '↘';
      default: return '—';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative p-5 rounded-xl border border-surface-200 bg-surface-50/60 backdrop-blur-sm space-y-4"
    >
      {/* Thin left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="flex justify-between items-start pl-2">
        <div>
          <h3 className="font-heading font-bold text-text-primary text-[17px]">
            {market.city}
          </h3>
          <p className="text-[13px] text-text-muted font-body">{market.venue}</p>
        </div>
        <span className="px-2.5 py-1 rounded text-[11px] font-medium tracking-wide bg-surface-100 text-text-muted border border-surface-200">
          {market.prediction.confidence}
        </span>
      </div>

      {/* Progress bars */}
      <div className="space-y-2 pl-2">
        <div className="text-[11px] text-text-muted font-body uppercase tracking-[0.12em]">
          Pacing Progress
        </div>

        {/* Current */}
        <div className="relative h-7 bg-surface-200 rounded overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(currentPct, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full flex items-center justify-end pr-2.5 bg-text-muted/20"
          >
            {currentPct > 15 && (
              <span className="text-[12px] font-medium text-text-secondary">
                {currentPct.toFixed(0)}%
              </span>
            )}
          </motion.div>
          {currentPct <= 15 && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-text-secondary">
              {currentPct.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Predicted */}
        <div className="relative h-7 bg-surface-200 rounded overflow-hidden border border-dashed border-surface-300">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(predictedPct, 100)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            className="h-full flex items-center justify-end pr-2.5 bg-accent/10"
          >
            {predictedPct > 15 && (
              <span className="text-[12px] font-medium text-accent/80">
                {predictedPct.toFixed(0)}%
              </span>
            )}
          </motion.div>
          {predictedPct <= 15 && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-medium text-accent/80">
              {predictedPct.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pl-2">
        <div>
          <p className="text-[11px] text-text-muted font-body uppercase tracking-[0.12em] mb-0.5">Current</p>
          <p className="font-heading text-[15px] font-bold text-text-primary">
            {formatPct(market.pctSold)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted font-body uppercase tracking-[0.12em] mb-0.5">Predicted</p>
          <p className="font-heading text-[15px] font-bold text-text-primary">
            {formatPct(market.prediction.blendedPredPct)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted font-body uppercase tracking-[0.12em] mb-0.5">Trend</p>
          <p className="font-body text-[15px] text-text-secondary">
            {getTrendArrow(market.velocityTrend)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
