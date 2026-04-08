'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Market, BenchmarkData } from '@/lib/types/flight';
import { formatNumber, formatPct, formatCurrency, getStatusLabel, tierAccentColor } from '@/lib/utils/formatters';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface MarketDeepDivesProps {
  markets: Market[];
  cptRates: number[];
  benchmark?: BenchmarkData;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function MarketDeepDives({ markets, cptRates, benchmark }: MarketDeepDivesProps) {

  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(
    new Set(
      markets
        .filter((m) => m.prediction.tier === 'red' || m.prediction.tier === 'orange')
        .map((m) => `${m.city}-${m.showDate}`)
    )
  );
  const [showGreen, setShowGreen] = useState(false);

  const getTierOrder = (tier: string) => {
    const order: Record<string, number> = {
      red: 0, orange: 1, yellow: 2, green_on_pace: 3, green_sold_out: 4,
    };
    return order[tier] ?? 5;
  };

  const sortedMarkets = [...markets].sort((a, b) => getTierOrder(a.prediction.tier) - getTierOrder(b.prediction.tier));

  const visibleMarkets = showGreen
    ? sortedMarkets
    : sortedMarkets.filter(
        (m) => m.prediction.tier === 'red' || m.prediction.tier === 'orange' || m.prediction.tier === 'yellow'
      );

  const toggleMarket = (marketId: string) => {
    const newExpanded = new Set(expandedMarkets);
    if (newExpanded.has(marketId)) {
      newExpanded.delete(marketId);
    } else {
      newExpanded.add(marketId);
    }
    setExpandedMarkets(newExpanded);
  };

  return (
    <motion.div
      initial={false}
      animate="visible"
      variants={fadeUp}
      className="space-y-4"
    >
      <button
        onClick={() => setShowGreen(!showGreen)}
        className="px-4 py-2 rounded-lg text-[13px] font-body tracking-wide bg-surface-100 text-text-muted hover:text-text-primary hover:bg-surface-200 transition-all border border-surface-200"
      >
        {showGreen ? 'Hide' : 'Show'} Green Markets
      </button>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {visibleMarkets.map((market, idx) => {
            const marketId = `${market.city}-${market.showDate}`;
            const isExpanded = expandedMarkets.has(marketId);
            return (
              <MarketDeepDiveCard
                key={marketId}
                market={market}
                isExpanded={isExpanded}
                onToggle={() => toggleMarket(marketId)}
                cptRates={cptRates}
                index={idx}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MarketDeepDiveCard({
  market,
  isExpanded,
  onToggle,
  cptRates,
  index,
}: {
  market: Market;
  isExpanded: boolean;
  onToggle: () => void;
  cptRates: number[];
  index: number;
}) {
  const accentColor = tierAccentColor(market.prediction.tier);
  const progressPct = Math.min(market.pctSold * 100, 100);
  const velocityData = [
    { name: 'Avg Weekly', value: market.avgWeeklyVelocity },
    { name: 'Recent Weekly', value: market.recentWeeklyVelocity },
    { name: 'Required', value: market.prediction.requiredWeeklyVelocity },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
      className="relative rounded-2xl border border-surface-200 bg-surface-50 overflow-hidden group"
    >
      {/* Top gradient bar based on tier */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44 70%, transparent)` }}
      />

      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-6 hover:bg-surface-100/40 transition-all focus:outline-none"
      >
        <div className="flex items-start justify-between gap-6">
          {/* Left: city + venue + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-heading text-xl font-bold text-text-primary truncate">
                {market.city}
              </h3>
              <span className="text-text-muted text-sm">·</span>
              <span className="text-sm text-text-secondary font-body">{market.country}</span>
            </div>
            <p className="text-sm text-text-muted font-body">{market.venue}</p>
          </div>

          {/* Right: sell pct + status */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="font-heading text-2xl font-bold text-text-primary leading-none">
                {formatPct(market.pctSold)}
              </p>
              <p className="text-[11px] text-text-muted font-body mt-0.5">sold</p>
            </div>
            <span
              className="text-[11px] font-semibold tracking-[0.08em] uppercase rounded-md px-3 py-1.5 border"
              style={{
                color: accentColor,
                borderColor: `${accentColor}44`,
                backgroundColor: `${accentColor}11`,
              }}
            >
              {getStatusLabel(market.prediction.tier)}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-text-muted text-sm"
            >
              ▼
            </motion.div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-baseline text-sm font-body">
            <span className="text-text-secondary">
              {formatNumber(market.ticketsSold)} / {formatNumber(market.capacity)}
            </span>
            {market.prediction.gap > 0 && (
              <span className="text-text-muted">
                Gap: <span className="text-text-primary font-medium">{formatNumber(market.prediction.gap)}</span>
              </span>
            )}
          </div>
          <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.05 + 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-surface-200 bg-surface-100/20">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Velocity chart */}
                <div>
                  <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-3 font-medium">
                    Velocity Analysis
                  </p>
                  <div className="h-44 rounded-xl border border-surface-200 p-3 bg-surface-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={velocityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                        <XAxis dataKey="name" stroke="#D4D4D8" tick={{ fontSize: 11, fill: '#D4D4D8' }} />
                        <YAxis stroke="#D4D4D8" tick={{ fontSize: 11, fill: '#D4D4D8' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1A1A',
                            border: '1px solid #2A2A2A',
                            borderRadius: '8px',
                            fontSize: '13px',
                          }}
                          labelStyle={{ color: '#FAFAFA' }}
                        />
                        <Bar dataKey="value" fill={accentColor} radius={4} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Budget + Predictions */}
                <div className="space-y-6">
                  {/* Budget by rate */}
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-3 font-medium">
                      Budget Requirements
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {market.prediction.budgets.map((budget) => (
                        <motion.div
                          key={budget.rate}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="p-4 rounded-xl border border-surface-200 bg-surface-50/80"
                        >
                          <p className="font-body text-[11px] text-text-muted uppercase tracking-wider mb-1">
                            @ ${budget.rate}/Ticket
                          </p>
                          <p className="font-heading text-xl font-bold text-text-primary">
                            {formatCurrency(budget.amount)}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Prediction details */}
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-3 font-medium">
                      Prediction
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <DetailStat label="Current" value={formatPct(market.pctSold)} />
                      <DetailStat label="Predicted" value={formatPct(market.prediction.blendedPredPct)} highlight />
                      <DetailStat label="Confidence" value={market.prediction.confidence} />
                      <DetailStat label="Trend" value={market.velocityTrend.replace('_', ' ')} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-lg border border-surface-200 bg-surface-50/60">
      <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-1">{label}</p>
      <p className={`font-heading text-[15px] font-bold capitalize ${highlight ? 'text-accent' : 'text-text-primary'}`}>{value}</p>
    </div>
  );
}
