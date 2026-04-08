'use client';
import { motion } from 'framer-motion';
import { Market } from '@/lib/types/flight';
import { formatCurrency, formatNumber, formatPct } from '@/lib/utils/formatters';

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

  const gapMarkets = markets.filter((m) => m.prediction.gap > 0);

  const totalGap = gapMarkets.reduce((sum, m) => sum + m.prediction.gap, 0);
  const budgetsByRate = cptRates.map((rate) => {
    const total = gapMarkets.reduce((sum, m) => {
      const budget = m.prediction.budgets.find((b) => b.rate === rate);
      return sum + (budget?.amount || 0);
    }, 0);
    return { rate, total };
  });

  return (
    <motion.div
      initial={false}
      animate="visible"
      variants={stagger}
      className="space-y-6"
    >
      <motion.div variants={fadeUp} className="overflow-x-auto">
        <table className="w-full font-body text-[13px]">
          <thead>
            <tr className="border-b border-surface-200">
              <th className="text-left py-3 px-4 text-text-muted uppercase text-[11px] tracking-[0.12em] font-medium">
                Market
              </th>
              <th className="text-right py-3 px-4 text-text-muted uppercase text-[11px] tracking-[0.12em] font-medium">
                Gap
              </th>
              {cptRates.map((rate) => (
                <th
                  key={rate}
                  className="text-right py-3 px-4 text-text-muted uppercase text-[11px] tracking-[0.12em] font-medium"
                >
                  @ ${rate} CPT
                </th>
              ))}
              <th className="text-right py-3 px-4 text-text-muted uppercase text-[11px] tracking-[0.12em] font-medium">
                Req'd Vel.
              </th>
              <th className="text-right py-3 px-4 text-text-muted uppercase text-[11px] tracking-[0.12em] font-medium">
                Current Vel.
              </th>
              <th className="text-right py-3 px-4 text-text-muted uppercase text-[11px] tracking-[0.12em] font-medium">
                Vel. Gap
              </th>
            </tr>
          </thead>
          <tbody>
            {gapMarkets.map((market) => (
              <tr
                key={`${market.city}-${market.showDate}`}
                className="border-b border-surface-200/60 hover:bg-surface-100/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <p className="font-medium text-text-primary">{market.city}</p>
                  <p className="text-[12px] text-text-muted">{market.venue}</p>
                </td>
                <td className="text-right py-3 px-4 text-text-primary font-medium">
                  {formatNumber(market.prediction.gap)}
                </td>
                {cptRates.map((rate) => {
                  const budget = market.prediction.budgets.find((b) => b.rate === rate);
                  return (
                    <td key={rate} className="text-right py-3 px-4 text-text-secondary">
                      {formatCurrency(budget?.amount || 0)}
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4 text-text-secondary font-medium">
                  {formatNumber(market.prediction.requiredWeeklyVelocity)}/wk
                </td>
                <td className="text-right py-3 px-4 text-text-muted">
                  {formatNumber(market.recentWeeklyVelocity)}/wk
                </td>
                <td className="text-right py-3 px-4 text-accent font-medium">
                  {formatNumber(market.prediction.velocityGap)}/wk
                </td>
              </tr>
            ))}
            <tr className="border-t border-surface-300">
              <td className="py-4 px-4 font-heading text-text-primary font-bold text-[14px]">TOTAL</td>
              <td className="text-right py-4 px-4 font-heading text-text-primary font-bold">
                {formatNumber(totalGap)}
              </td>
              {budgetsByRate.map(({ rate, total }) => (
                <td key={rate} className="text-right py-4 px-4 font-heading text-accent font-bold">
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
    </motion.div>
  );
}
