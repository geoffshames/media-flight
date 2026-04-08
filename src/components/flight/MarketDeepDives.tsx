'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Market, BenchmarkData } from '@/lib/types/flight';
import { formatNumber, formatPct, formatCurrency, tierBg, tierTextColor } from '@/lib/utils/formatters';
import { useInView } from '@/hooks/useInView';
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

export function MarketDeepDives({ markets, cptRates, benchmark }: MarketDeepDivesProps) {
  const { ref, inView } = useInView();
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
      red: 0,
      orange: 1,
      yellow: 2,
      green_on_pace: 3,
      green_sold_out: 4,
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
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className="space-y-4"
    >
      {/* Show green toggle */}
      <button
        onClick={() => setShowGreen(!showGreen)}
        className="px-4 py-2 rounded font-body text-sm bg-surface-100 text-text-secondary hover:bg-surface-200 transition-colors"
      >
        {showGreen ? 'Hide' : 'Show'} Green Markets
      </button>

      {/* Market cards */}
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
      className={`rounded-lg border overflow-hidden transition-colors ${tierBg(
        market.prediction.tier
      )} backdrop-blur-sm`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-6 hover:bg-white/2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-text-primary">
              {market.city}, {market.country}
            </h3>
            <p className="text-xs sm:text-sm text-text-muted font-body mt-1">{market.venue}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${tierBg(
                market.prediction.tier
              )}`}
            >
              {market.prediction.tierLabel}
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-text-secondary"
            >
              ▼
            </motion.div>
          </div>
        </div>

        {/* Summary line */}
        <div className="mt-3 text-xs sm:text-sm text-text-secondary font-body space-y-1">
          <p>
            {formatNumber(market.ticketsSold)} / {formatNumber(market.capacity)} •{' '}
            <span className={tierTextColor(market.prediction.tier)}>
              {formatPct(market.pctSold)}
            </span>
            {market.prediction.gap > 0 && (
              <>
                {' '}
                • Gap: {formatNumber(market.prediction.gap)}
              </>
            )}
          </p>
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
            <div className="p-4 sm:p-6 space-y-6">
              {/* Pacing note */}
              {market.pacingNote && (
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-2">
                    Pacing Note
                  </p>
                  <p className="font-body text-sm text-text-secondary">{market.pacingNote}</p>
                </div>
              )}

              {/* Velocity chart */}
              <div>
                <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-3">
                  Velocity Analysis
                </p>
                <div className="h-40 bg-surface-100/50 rounded border border-surface-200 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                      <XAxis dataKey="name" stroke="#B8B8C0" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#B8B8C0" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A1A1A',
                          border: '1px solid #333333',
                          borderRadius: '4px',
                        }}
                        labelStyle={{ color: '#FAFAFA' }}
                      />
                      <Bar dataKey="value" fill="#FD3737" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget by rate */}
              <div>
                <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-3">
                  Budget Requirements
                </p>
                <div className="space-y-2">
                  {market.prediction.budgets.map((budget) => (
                    <div
                      key={budget.rate}
                      className="flex justify-between items-center p-2 bg-surface-100/50 rounded border border-surface-200/50"
                    >
                      <span className="font-body text-sm text-text-secondary">
                        @ ${budget.rate} CPT:
                      </span>
                      <span className="font-semibold text-text-primary">
                        {formatCurrency(budget.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prediction details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-1">
                    Current %
                  </p>
                  <p className={`font-display text-lg font-bold ${tierTextColor(market.prediction.tier)}`}>
                    {formatPct(market.pctSold)}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-1">
                    Predicted %
                  </p>
                  <p className="font-display text-lg font-bold text-text-primary">
                    {formatPct(market.prediction.blendedPredPct)}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-1">
                    Confidence
                  </p>
                  <p className="font-body text-sm font-semibold text-text-secondary capitalize">
                    {market.prediction.confidence}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-1">
                    Trend
                  </p>
                  <p className="font-body text-sm font-semibold text-text-secondary capitalize">
                    {market.velocityTrend.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
