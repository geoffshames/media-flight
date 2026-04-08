'use client';
import { motion } from 'framer-motion';
import { FlightPlan } from '@/lib/types/flight';
import { formatNumber, formatPct, formatCurrency } from '@/lib/utils/formatters';
import { AnimatedNumber } from '@/components/common/AnimatedNumber';


interface FlightHeroProps {
  data: FlightPlan;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export function FlightHero({ data }: FlightHeroProps) {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'green_sold_out':
      case 'green_on_pace':
        return 'text-tier-green';
      case 'yellow':
        return 'text-tier-yellow';
      case 'orange':
        return 'text-tier-orange';
      case 'red':
        return 'text-tier-red';
      default:
        return 'text-text-primary';
    }
  };

  const getTierCount = (tier: string) => {
    switch (tier) {
      case 'green':
        return data.summary.tierCounts.green;
      case 'yellow':
        return data.summary.tierCounts.yellow;
      case 'orange':
        return data.summary.tierCounts.orange;
      case 'red':
        return data.summary.tierCounts.red;
      default:
        return 0;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-surface via-surface to-surface-100 pt-24 px-4 sm:px-6 lg:px-8"
    >
      {/* Accent orbs */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-10 w-80 h-80 bg-accent/3 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main heading */}
        <motion.div variants={fadeUp} className="mb-4">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-text-primary leading-tight tracking-tight">
            {data.artist}
          </h1>
        </motion.div>

        {/* Tour info */}
        <motion.div variants={fadeUp} className="mb-12">
          <p className="font-body text-lg md:text-xl text-text-secondary mb-1">
            {data.tourName}
          </p>
          <p className="font-body text-sm md:text-base text-text-muted">
            {data.legName} • {data.dateRange}
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12"
        >
          <StatCard
            label="Total Markets"
            value={data.summary.totalMarkets}
            format={(n) => n.toString()}
            variants={fadeUp}
          />
          <StatCard
            label="Total Capacity"
            value={data.summary.totalCapacity}
            format={formatNumber}
            variants={fadeUp}
          />
          <StatCard
            label="Tickets Sold"
            value={data.summary.totalSold}
            format={formatNumber}
            variants={fadeUp}
          />
          <StatCard
            label="Sell-Through %"
            value={Math.round(data.summary.avgSellThrough * 1000) / 10}
            format={(n) => `${n.toFixed(1)}%`}
            variants={fadeUp}
          />
          <StatCard
            label="Predicted Gap"
            value={data.summary.totalPredictedGap}
            format={formatNumber}
            variants={fadeUp}
          />
          <StatCard
            label={`Recommended Budget (@ $${data.cptRates[0]} CPT)`}
            value={
              data.summary.budgetRecommendations[0]?.totalBudget || 0
            }
            format={formatCurrency}
            variants={fadeUp}
          />
        </motion.div>

        {/* Tier summary */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap gap-6 text-text-secondary font-body text-sm md:text-base"
        >
          {getTierCount('green') > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-tier-green" />
              <span>
                <span className="text-tier-green font-semibold">{getTierCount('green')}</span> Sold
                Out
              </span>
            </div>
          )}
          {getTierCount('yellow') > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-tier-yellow" />
              <span>
                <span className="text-tier-yellow font-semibold">{getTierCount('yellow')}</span> On
                Pace
              </span>
            </div>
          )}
          {getTierCount('orange') > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-tier-orange" />
              <span>
                <span className="text-tier-orange font-semibold">{getTierCount('orange')}</span>{' '}
                Need Push
              </span>
            </div>
          )}
          {getTierCount('red') > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-tier-red" />
              <span>
                <span className="text-tier-red font-semibold">{getTierCount('red')}</span> Critical
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  format: (n: number) => string;
  variants: any;
}

function StatCard({ label, value, format, variants }: StatCardProps) {
  return (
    <motion.div variants={variants} className="p-4 sm:p-6 rounded-lg border border-surface-200 bg-surface-50/40 backdrop-blur-sm">
      <p className="font-body text-xs sm:text-sm text-text-muted mb-2 uppercase tracking-wider">
        {label}
      </p>
      <p className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
        <AnimatedNumber value={value} format={format} />
      </p>
    </motion.div>
  );
}
