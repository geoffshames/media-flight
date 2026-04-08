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

  const sellThrough = Math.round(data.summary.avgSellThrough * 1000) / 10;

  return (
    <motion.div
      initial={false}
      animate="visible"
      variants={stagger}
      className="relative w-full overflow-hidden bg-surface pt-20 pb-12 px-4 sm:px-6 lg:px-8"
    >
      {/* Gradient orbs for visual depth */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-accent/[0.06] rounded-full blur-[150px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/[0.03] rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top row: Artist + sell-through ring */}
        <div className="flex items-end justify-between gap-8 mb-6">
          <motion.div variants={fadeUp}>
            <h1 className="font-heading text-7xl md:text-8xl lg:text-[8rem] font-bold text-text-primary leading-[0.9] tracking-tight">
              {data.artist}
            </h1>
            <div className="mt-3 flex items-center gap-4">
              <p className="font-body text-xl md:text-2xl text-text-secondary font-light">
                {data.tourName}
              </p>
              <span className="text-surface-300 text-xl">·</span>
              <p className="font-body text-lg text-text-muted">
                {data.legName}
              </p>
            </div>
            <p className="font-body text-sm text-text-muted mt-1">
              {data.dateRange}
            </p>
          </motion.div>

          {/* Large sell-through stat */}
          <motion.div variants={fadeUp} className="hidden md:flex flex-col items-end">
            <p className="font-heading text-6xl lg:text-7xl font-bold text-text-primary leading-none">
              <AnimatedNumber value={sellThrough} format={(n) => `${n.toFixed(1)}%`} />
            </p>
            <p className="font-body text-sm text-text-muted uppercase tracking-[0.12em] mt-1">
              Sell-Through
            </p>
          </motion.div>
        </div>

        {/* Stats grid — compact */}
        <motion.div
          variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8"
        >
          <StatCard
            label="Markets"
            value={data.summary.totalMarkets}
            format={(n) => n.toString()}
            variants={fadeUp}
          />
          <StatCard
            label="Capacity"
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
            label="Predicted Gap"
            value={data.summary.totalPredictedGap}
            format={formatNumber}
            variants={fadeUp}
          />
          <StatCard
            label={`Budget @ $${data.cptRates[0]}/Ticket`}
            value={data.summary.budgetRecommendations[0]?.totalBudget || 0}
            format={formatCurrency}
            variants={fadeUp}
            accent
          />
        </motion.div>

        {/* Tier summary + scroll hint */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div className="flex flex-wrap gap-6 text-text-muted font-body text-sm tracking-wide">
            {tierSummary.map((t) => (
              <span key={t.label}>
                <span className="text-text-primary font-semibold">{t.count}</span>{' '}
                {t.label}
              </span>
            ))}
          </div>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="text-text-muted text-xs tracking-widest uppercase flex flex-col items-center gap-1"
          >
            <span>Scroll</span>
            <span className="text-lg">↓</span>
          </motion.div>
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
      className={`p-4 rounded-xl border backdrop-blur-sm ${
        accent
          ? 'border-accent/30 bg-accent/[0.06]'
          : 'border-surface-200 bg-surface-50/80'
      }`}
    >
      <p className="font-body text-[11px] text-text-muted mb-2 uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary">
        <AnimatedNumber value={value} format={format} />
      </p>
    </motion.div>
  );
}
