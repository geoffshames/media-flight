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
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export function FlightHero({ data }: FlightHeroProps) {
  const tierSummary = [
    { count: data.summary.tierCounts.green, label: 'Sold Out' },
    { count: data.summary.tierCounts.yellow, label: 'On Pace' },
    { count: data.summary.tierCounts.orange, label: 'Needs Push' },
    { count: data.summary.tierCounts.red, label: 'Critical' },
  ].filter((t) => t.count > 0);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="relative min-h-screen w-full overflow-hidden bg-surface pt-24 px-4 sm:px-6 lg:px-8"
    >
      {/* Subtle gradient orb */}
      <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Artist name */}
        <motion.div variants={fadeUp} className="mb-4">
          <h1 className="font-heading text-6xl md:text-8xl lg:text-[7rem] font-bold text-text-primary leading-[0.95] tracking-tight">
            {data.artist}
          </h1>
        </motion.div>

        {/* Tour info */}
        <motion.div variants={fadeUp} className="mb-16">
          <p className="font-body text-lg md:text-xl text-text-secondary font-light mb-1">
            {data.tourName}
          </p>
          <p className="font-body text-sm text-text-muted">
            {data.legName} · {data.dateRange}
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16"
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
            label="Sell-Through"
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
            label={`Budget (@ $${data.cptRates[0]} CPT)`}
            value={data.summary.budgetRecommendations[0]?.totalBudget || 0}
            format={formatCurrency}
            variants={fadeUp}
            accent
          />
        </motion.div>

        {/* Tier summary — minimal text only */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap gap-8 text-text-muted font-body text-[13px] tracking-wide"
        >
          {tierSummary.map((t) => (
            <span key={t.label}>
              <span className="text-text-primary font-medium">{t.count}</span>{' '}
              {t.label}
            </span>
          ))}
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
  accent?: boolean;
}

function StatCard({ label, value, format, variants, accent }: StatCardProps) {
  return (
    <motion.div
      variants={variants}
      className={`p-5 rounded-xl border backdrop-blur-sm ${
        accent
          ? 'border-accent/20 bg-accent/[0.04]'
          : 'border-surface-200 bg-surface-50/60'
      }`}
    >
      <p className="font-body text-[11px] text-text-muted mb-2.5 uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className={`font-heading text-2xl sm:text-3xl font-bold ${accent ? 'text-text-primary' : 'text-text-primary'}`}>
        <AnimatedNumber value={value} format={format} />
      </p>
    </motion.div>
  );
}
