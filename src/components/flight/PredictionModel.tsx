'use client';
import { motion } from 'framer-motion';
import { Market } from '@/lib/types/flight';
import { formatPct } from '@/lib/utils/formatters';


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

  // Filter to non-green markets
  const riskMarkets = markets.filter(
    (m) => m.prediction.tier !== 'green_sold_out' && m.prediction.tier !== 'green_on_pace'
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'accelerating':
        return '📈';
      case 'steady':
        return '→';
      case 'decelerating':
        return '📉';
      default:
        return '—';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-tier-green/20 border-tier-green/30 text-tier-green';
      case 'medium':
        return 'bg-tier-yellow/20 border-tier-yellow/30 text-tier-yellow';
      case 'low':
        return 'bg-tier-red/20 border-tier-red/30 text-tier-red';
      default:
        return 'bg-surface-100 border-surface-200';
    }
  };

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

      <motion.p variants={fadeUp} className="font-body text-text-secondary max-w-2xl">
        Current vs. predicted sell-through based on velocity trends and historical day-out multipliers.
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {riskMarkets.map((market, idx) => (
          <PredictionCard key={`${market.city}-${market.showDate}`} market={market} delay={idx * 0.05} />
        ))}
      </div>
    </motion.div>
  );
}

function PredictionCard({ market, delay }: { market: Market; delay: number }) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'accelerating':
        return '↗️';
      case 'steady':
        return '→';
      case 'decelerating':
        return '↘️';
      default:
        return '—';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-tier-green/20 border-tier-green/30 text-tier-green';
      case 'medium':
        return 'bg-tier-yellow/20 border-tier-yellow/30 text-tier-yellow';
      case 'low':
        return 'bg-tier-red/20 border-tier-red/30 text-tier-red';
      default:
        return 'bg-surface-100 border-surface-200';
    }
  };

  const currentPct = market.pctSold * 100;
  const predictedPct = market.prediction.blendedPredPct * 100;
  const totalWidth = Math.max(currentPct, predictedPct, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="p-4 sm:p-6 rounded-lg border border-surface-200 bg-surface-50/40 backdrop-blur-sm space-y-4"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-heading font-bold text-text-primary text-lg">
            {market.city}
          </h3>
          <p className="text-xs text-text-muted font-body">{market.venue}</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getConfidenceColor(
            market.prediction.confidence
          )}`}
        >
          {market.prediction.confidence}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="text-xs text-text-muted font-body uppercase tracking-wider">
          Pacing Progress
        </div>
        <div className="space-y-1">
          {/* Current */}
          <div className="relative h-8 bg-surface-200 rounded overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(currentPct, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full flex items-center justify-end pr-2 ${
                market.prediction.tier === 'yellow'
                  ? 'bg-tier-yellow/70'
                  : market.prediction.tier === 'orange'
                    ? 'bg-tier-orange/70'
                    : 'bg-tier-red/70'
              }`}
            >
              {currentPct > 10 && (
                <span className="text-xs font-bold text-text-primary">
                  {currentPct.toFixed(0)}%
                </span>
              )}
            </motion.div>
            {currentPct <= 10 && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-text-primary">
                {currentPct.toFixed(0)}%
              </span>
            )}
          </div>

          {/* Predicted */}
          <div className="relative h-8 bg-surface-200 rounded overflow-hidden border-2 border-dashed border-accent/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(predictedPct, 100)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className="h-full flex items-center justify-end pr-2 bg-accent/20"
            >
              {predictedPct > 10 && (
                <span className="text-xs font-bold text-accent">
                  {predictedPct.toFixed(0)}%
                </span>
              )}
            </motion.div>
            {predictedPct <= 10 && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-accent">
                {predictedPct.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-surface-100 rounded border border-surface-200">
          <p className="text-xs text-text-muted font-body mb-1">Current</p>
          <p className="font-heading font-bold text-text-primary">
            {formatPct(market.pctSold)}
          </p>
        </div>
        <div className="p-2 bg-surface-100 rounded border border-surface-200">
          <p className="text-xs text-text-muted font-body mb-1">Predicted</p>
          <p className="font-heading font-bold text-accent">
            {formatPct(market.prediction.blendedPredPct)}
          </p>
        </div>
        <div className="p-2 bg-surface-100 rounded border border-surface-200">
          <p className="text-xs text-text-muted font-body mb-1">Trend</p>
          <p className="font-heading font-bold text-text-primary">
            {getTrendIcon(market.velocityTrend)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
