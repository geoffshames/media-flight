'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Market } from '@/lib/types/flight';
import { formatDate, formatPct, formatNumber, tierBg, tierTextColor } from '@/lib/utils/formatters';

import { GlassCard } from '@/components/common/GlassCard';

interface MarketOverviewProps {
  markets: Market[];
}

type SortBy = 'date' | 'gap' | 'tier' | 'pct';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0 },
  },
};

export function MarketOverview({ markets }: MarketOverviewProps) {
  
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const getTierOrder = (tier: string) => {
    const order: Record<string, number> = {
      red: 0,
      orange: 1,
      yellow: 2,
      green_on_pace: 3,
      green_sold_out: 4,
    };
    return order[tier] ?? 5;
  };

  const sortedMarkets = [...markets].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.showDate).getTime() - new Date(b.showDate).getTime();
      case 'gap':
        return b.prediction.gap - a.prediction.gap;
      case 'tier':
        return getTierOrder(a.prediction.tier) - getTierOrder(b.prediction.tier);
      case 'pct':
        return b.pctSold - a.pctSold;
      default:
        return 0;
    }
  });

  return (
    <motion.div
      
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6"
    >
      {/* Sort buttons */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        {(['date', 'gap', 'tier', 'pct'] as SortBy[]).map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`px-4 py-2 rounded font-body text-sm transition-colors ${
              sortBy === sort
                ? 'bg-accent text-surface font-semibold'
                : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
            }`}
          >
            {sort === 'date' && 'Date'}
            {sort === 'gap' && 'Gap'}
            {sort === 'tier' && 'Tier'}
            {sort === 'pct' && '% Sold'}
          </button>
        ))}
      </motion.div>

      {/* Market cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedMarkets.map((market, idx) => (
          <MarketCard
            key={`${market.city}-${market.showDate}`}
            market={market}
            delay={idx * 0.05}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MarketCard({ market, delay }: { market: Market; delay: number }) {
  const gap = market.prediction.gap;
  const gapPct = gap / market.capacity;
  const progressPct = Math.min(market.pctSold * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <GlassCard
        className={`border ${tierBg(market.prediction.tier)} h-full`}
        hover
        delay={delay}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-text-primary">
                {market.city}
              </h3>
              <p className="text-xs sm:text-sm text-text-muted">{market.country}</p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${tierBg(
                market.prediction.tier
              )}`}
            >
              {market.prediction.tierLabel}
            </div>
          </div>

          {/* Venue and date */}
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-text-secondary font-body">{market.venue}</p>
            <p className="text-xs text-text-muted font-body">{formatDate(market.showDate)}</p>
          </div>

          {/* Capacity progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted font-body">
                {formatNumber(market.ticketsSold)} / {formatNumber(market.capacity)}
              </span>
              <span className={`font-display font-bold text-lg ${tierTextColor(market.prediction.tier)}`}>
                {formatPct(market.pctSold)}
              </span>
            </div>
            <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className={`h-full ${
                  market.prediction.tier === 'green_sold_out' ||
                  market.prediction.tier === 'green_on_pace'
                    ? 'bg-tier-green'
                    : market.prediction.tier === 'yellow'
                      ? 'bg-tier-yellow'
                      : market.prediction.tier === 'orange'
                        ? 'bg-tier-orange'
                        : 'bg-tier-red'
                }`}
              />
            </div>
          </div>

          {/* Gap info */}
          {gap > 0 && (
            <div className="pt-2 border-t border-surface-200">
              <p className="text-xs text-text-muted font-body mb-1">Predicted Gap</p>
              <p className="font-display font-bold text-text-primary">
                {formatNumber(gap)} tickets ({formatPct(gapPct)})
              </p>
            </div>
          )}

          {/* Days out */}
          <div className="pt-2 border-t border-surface-200">
            <p className="text-xs text-text-muted font-body">
              {market.daysOut > 0 ? `${market.daysOut} days out` : 'Show date'}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
