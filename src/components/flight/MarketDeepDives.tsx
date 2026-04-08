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
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="space-y-4"
    >
      <button
        onClick={() => setShowGreen(!showGreen)}
        className="px-4 py-2 rounded text-[13px] font-body tracking-wide bg-surface-100 text-text-muted hover:text-text-secondary hover:bg-surface-200 transition-colors border border-surface-200"
      >
        {showGreen ? 'Hide' : 'Show'} Green Markets
      </button>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleMarkets.map((market) => {
            const marketId = `${market.city}-${market.showDate}`;
            const isExpanded = expandedMarkets.has(marketId);
            return (
              <MarketDeepDiveCard
                key={marketId}
                market={market}
                isExpanded={isExpanded}
                onToggle={() => toggleMarket(marketId)}
                cptRates={cptRates}
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
}: {
  market: Market;
  isExpanded: boolean;
  onToggle: () => void;
  cptRates: number[];
}) {
  const accentColor = tierAccentColor(market.prediction.tier);
  const velocityData = [
    { name: 'Avg Weekly', value: market.avgWeeklyVelocity },
    { name: 'Recent Weekly', value: market.recentWeeklyVelocity },
    { name: 'Required', value: market.prediction.requiredWeeklyVelocity },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative rounded-xl border border-surface-200 bg-surface-50/60 overflow-hidden backdrop-blur-sm"
    >
      {/* Thin left accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 pl-6 hover:bg-surface-100/30 transition-colors focus:outline-none"
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-heading text-[17px] font-bold text-text-primary">
              {market.city}, {market.country}
            </h3>
            <p className="text-[13px] text-text-muted font-body mt-0.5">{market.venue}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted bg-surface-100 border border-surface-200 rounded px-2.5 py-1">
              {getStatusLabel(market.prediction.tier)}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-text-muted text-[12px]"
            >
              ▼
            </motion.div>
          </div>
        </div>

        <div className="mt-2.5 text-[13px] text-text-muted font-body flex items-center gap-2">
          <span>{formatNumber(market.ticketsSold)} / {formatNumber(market.capacity)}</span>
          <span className="text-surface-300">·</span>
          <span className="text-text-secondary font-medium">{formatPct(market.pctSold)}</span>
          {market.prediction.gap > 0 && (
            <>
              <span className="text-surface-300">·</span>
              <span>Gap: {formatNumber(market.prediction.gap)}</span>
            </>
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-surface-200 overflow-hidden"
          >
            <div className="p-5 pl-6 space-y-6">
              {/* Velocity chart */}
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-3">
                  Velocity Analysis
                </p>
                <div className="h-36 border border-surface-200 rounded-lg p-2 bg-surface-100/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                      <XAxis dataKey="name" stroke="#71717A" tick={{ fontSize: 11, fill: '#71717A' }} />
                      <YAxis stroke="#71717A" tick={{ fontSize: 11, fill: '#71717A' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A1A1A',
                          border: '1px solid #222222',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                        labelStyle={{ color: '#FAFAFA' }}
                      />
                      <Bar dataKey="value" fill="#A1A1AA" radius={3} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget by rate */}
              <div>
                <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-3">
                  Budget Requirements
                </p>
                <div className="space-y-2">
                  {market.prediction.budgets.map((budget) => (
                    <div
                      key={budget.rate}
                      className="flex justify-between items-center p-3 border border-surface-200 rounded-lg bg-surface-100/30"
                    >
                      <span className="font-body text-[13px] text-text-muted">
                        @ ${budget.rate} CPT
                      </span>
                      <span className="font-heading text-[15px] font-bold text-text-primary">
                        {formatCurrency(budget.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prediction details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DetailStat label="Current" value={formatPct(market.pctSold)} />
                <DetailStat label="Predicted" value={formatPct(market.prediction.blendedPredPct)} />
                <DetailStat label="Confidence" value={market.prediction.confidence} />
                <DetailStat label="Trend" value={market.velocityTrend.replace('_', ' ')} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-[11px] uppercase tracking-[0.12em] text-text-muted mb-1">{label}</p>
      <p className="font-body text-[14px] font-medium text-text-secondary capitalize">{value}</p>
    </div>
  );
}
