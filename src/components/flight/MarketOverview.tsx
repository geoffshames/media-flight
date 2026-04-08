'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Market } from '@/lib/types/flight';
import { formatDate, formatPct, formatNumber, getStatusLabel, tierAccentColor } from '@/lib/utils/formatters';

interface MarketOverviewProps {
  markets: Market[];
}

type SortBy = 'date' | 'gap' | 'tier' | 'pct';

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function MarketOverview({ markets }: MarketOverviewProps) {
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const getTierOrder = (tier: string) => {
    const order: Record<string, number> = {
      red: 0, orange: 1, yellow: 2, green_on_pace: 3, green_sold_out: 4,
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
            className={`px-4 py-2 rounded font-body text-[13px] tracking-wide transition-colors ${
              sortBy === sort
                ? 'bg-text-primary text-surface font-medium'
                : 'bg-surface-100 text-text-muted hover:text-text-secondary hover:bg-surface-200'
            }`}
          >
            {sort === 'date' && 'Date'}
            {sort === 'gap' && 'Gap'}
            {sort === 'tier' && 'Status'}
            {sort === 'pct' && '% Sold'}
          </button>
        ))}
      </motion.div>

      {/* Market cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMarkets.map((market, idx) => (
          <MarketCard
            key={`${market.city}-${market.showDate}`}
            market={market}
            delay={idx * 0.04}
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
  const accentColor = tierAccentColor(market.prediction.tier);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      className="relative rounded-xl border border-surface-200 bg-surface-50/60 backdrop-blur-sm overflow-hidden
                 transition-all duration-300 hover:border-surface-300 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Thin left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: accentColor }}
      />

      <div className="p-5 pl-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-heading text-[17px] font-bold text-text-primary leading-tight">
              {market.city}
            </h3>
            <p className="text-[13px] text-text-muted mt-0.5">{market.venue}</p>
          </div>
          <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted bg-surface-100 border border-surface-200 rounded px-2.5 py-1">
            {getStatusLabel(market.prediction.tier)}
          </span>
        </div>

        {/* Date + country */}
        <div className="flex items-center gap-3 text-[13px] text-text-muted">
          <span>{formatDate(market.showDate)}</span>
          {market.country !== 'United Kingdom' && (
            <>
              <span className="text-surface-200">·</span>
              <span>{market.country}</span>
            </>
          )}
          <span className="text-surface-200">·</span>
          <span>{market.daysOut > 0 ? `${market.daysOut}d out` : 'Show day'}</span>
        </div>

        {/* Capacity bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[13px] text-text-muted font-body">
              {formatNumber(market.ticketsSold)} / {formatNumber(market.capacity)}
            </span>
            <span className="font-heading text-lg font-bold text-text-primary">
              {formatPct(market.pctSold)}
            </span>
          </div>
          <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: delay + 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </div>

        {/* Gap info */}
        {gap > 0 && (
          <div className="flex justify-between items-baseline pt-3 border-t border-surface-200/60">
            <span className="text-[12px] text-text-muted uppercase tracking-wider">Gap</span>
            <span className="text-[14px] font-medium text-text-secondary">
              {formatNumber(gap)} tickets ({formatPct(gapPct)})
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
