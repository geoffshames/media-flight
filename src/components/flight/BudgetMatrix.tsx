'use client';
import { motion } from 'framer-motion';
import { Market } from '@/lib/types/flight';
import { formatCurrency, formatNumber, formatPct, tierBg } from '@/lib/utils/formatters';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface BudgetMatrixProps {
  markets: Market[];
  cptRates: number[];
}

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

export function BudgetMatrix({ markets, cptRates }: BudgetMatrixProps) {
  

  // Only markets with gaps
  const gapMarkets = markets.filter((m) => m.prediction.gap > 0);

  // Calculate totals
  const totalGap = gapMarkets.reduce((sum, m) => sum + m.prediction.gap, 0);
  const budgetsByRate = cptRates.map((rate) => {
    const total = gapMarkets.reduce((sum, m) => {
      const budget = m.prediction.budgets.find((b) => b.rate === rate);
      return sum + (budget?.amount || 0);
    }, 0);
    return { rate, total };
  });

  // Budget breakdown by tier
  const tierBudgets: Array<{ name: string; value: number; color: string }> = [];
  const tiers = ['red', 'orange', 'yellow', 'green_on_pace'];
  const tierColors = {
    red: '#FF1744',
    orange: '#FF9100',
    yellow: '#FFD600',
    green_on_pace: '#00E676',
  };

  tiers.forEach((tier) => {
    const tierMarkets = gapMarkets.filter((m) => m.prediction.tier === tier);
    if (tierMarkets.length > 0) {
      const budget = tierMarkets.reduce((sum, m) => {
        const b = m.prediction.budgets.find((b) => b.rate === 20);
        return sum + (b?.amount || 0);
      }, 0);
      if (budget > 0) {
        tierBudgets.push({
          name: tier === 'green_on_pace' ? 'Green On Pace' : tier.charAt(0).toUpperCase() + tier.slice(1),
          value: budget,
          color: tierColors[tier as keyof typeof tierColors],
        });
      }
    }
  });

  return (
    <motion.div
      
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6"
    >
      {/* Table */}
      <motion.div variants={fadeUp} className="overflow-x-auto">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="text-left py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                Market
              </th>
              <th className="text-right py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                Gap
              </th>
              {cptRates.map((rate) => (
                <th
                  key={rate}
                  className="text-right py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold"
                >
                  @ ${rate} CPT
                </th>
              ))}
              <th className="text-right py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                Req'd Velocity
              </th>
              <th className="text-right py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                Current Velocity
              </th>
              <th className="text-right py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                Velocity Gap
              </th>
            </tr>
          </thead>
          <tbody>
            {gapMarkets.map((market) => (
              <tr
                key={`${market.city}-${market.showDate}`}
                className={`border-b border-surface-200 hover:bg-surface-50/50 transition-colors ${tierBg(
                  market.prediction.tier
                )}`}
              >
                <td className="py-3 px-4">
                  <div>
                    <p className="font-semibold text-text-primary">{market.city}</p>
                    <p className="text-xs text-text-muted">{market.venue}</p>
                  </div>
                </td>
                <td className="text-right py-3 px-4 text-text-primary font-semibold">
                  {formatNumber(market.prediction.gap)}
                </td>
                {cptRates.map((rate) => {
                  const budget = market.prediction.budgets.find((b) => b.rate === rate);
                  return (
                    <td key={rate} className="text-right py-3 px-4 text-text-primary">
                      {formatCurrency(budget?.amount || 0)}
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4 text-text-primary font-semibold">
                  {formatNumber(market.prediction.requiredWeeklyVelocity)}/wk
                </td>
                <td className="text-right py-3 px-4 text-text-secondary">
                  {formatNumber(market.recentWeeklyVelocity)}/wk
                </td>
                <td className="text-right py-3 px-4 text-tier-red font-semibold">
                  {formatNumber(market.prediction.velocityGap)}/wk
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="border-t-2 border-accent bg-surface-100 font-semibold">
              <td className="py-4 px-4 text-text-primary">TOTAL</td>
              <td className="text-right py-4 px-4 text-text-primary">
                {formatNumber(totalGap)}
              </td>
              {budgetsByRate.map(({ rate, total }) => (
                <td key={rate} className="text-right py-4 px-4 text-accent">
                  {formatCurrency(total)}
                </td>
              ))}
              <td className="text-right py-4 px-4" />
              <td className="text-right py-4 px-4" />
              <td className="text-right py-4 px-4" />
            </tr>
          </tbody>
        </table>
      </motion.div>

      {/* Donut chart */}
      {tierBudgets.length > 0 && (
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col justify-center">
            <h3 className="font-display text-lg font-bold text-text-primary mb-4">
              Budget by Tier
            </h3>
            <div className="space-y-3">
              {tierBudgets.map((tier) => (
                <div key={tier.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-text-secondary">{tier.name}</span>
                  </div>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(tier.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierBudgets}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {tierBudgets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#FAFAFA' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
