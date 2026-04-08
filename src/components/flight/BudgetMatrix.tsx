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
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
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
        const b = m.prediction.budgets.find((b) => b.rate === cptRates[0]);
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
            </tr>
          </thead>
          <tbody>
            {gapMarkets.map((market) => (
              <tr key={`${market.city}-${market.showDate}`} className="border-b border-surface-100 hover:bg-surface-50/40">
                <td className={`py-3 px-4 font-body text-sm border ${tierBg(market.prediction.tier)}`}>
                  <p className="font-semibold">{market.city}</p>
                  <p className="text-xs text-text-muted">{market.country}</p>
                </td>
                <td className={`py-3 px-4 text-right font-body border ${tierBg(market.prediction.tier)}`}>
                  <p className="font-semibold">{formatNumber(market.prediction.gap)}</p>
                  <p className="text-xs text-text-muted">{formatPct(market.prediction.gap / market.capacity)}</p>
                </td>
                {market.prediction.budgets.map((budget) => (
                  <td key={budget.rate} className={`py-3 px-4 text-right font-body border ${tierBg(market.prediction.tier)}`}>
                    <p className="font-semibold">{formatCurrency(budget.amount)}</p>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-accent">
              <td className="py-3 px-4 font-heading font-bold text-text-primary">TOTAL</td>
              <td className="py-3 px-4 text-right font-heading font-bold text-text-primary">
                {formatNumber(totalGap)}
              </td>
              {budgetsByRate.map(({ rate, total }) => (
                <td key={rate} className="py-3 px-4 text-right font-heading font-bold text-accent">
                  {formatCurrency(total)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </motion.div>

      {/* Budget pie chart */}
      {tierBudgets.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="font-heading text-lg font-bold text-text-primary mb-4">
            Budget Breakdown by Tier (@ ${cptRates[0]} CPT)
          </h3>
          <div className="h-80 bg-surface-50/40 border border-surface-200 rounded-lg p-4 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierBudgets}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierBudgets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#FAFAFA' }}
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
