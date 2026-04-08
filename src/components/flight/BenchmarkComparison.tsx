'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BenchmarkData } from '@/lib/types/flight';
import { formatPct, formatNumber } from '@/lib/utils/formatters';

interface BenchmarkComparisonProps {
  benchmark: BenchmarkData;
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

export function BenchmarkComparison({ benchmark }: BenchmarkComparisonProps) {
  const [expandedShow, setExpandedShow] = useState<string | null>(null);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Shows"
          value={benchmark.totalShows}
          format={(n) => n.toString()}
          variants={fadeUp}
        />
        <SummaryCard
          label="Avg Sell-Through"
          value={benchmark.avgSellThrough}
          format={formatPct}
          variants={fadeUp}
        />
        <SummaryCard
          label="Sold Out"
          value={benchmark.soldOutCount}
          format={(n) => `${n} (${formatPct(benchmark.soldOutPct)})`}
          variants={fadeUp}
        />
      </div>

      {/* Pacing benchmarks table */}
      <motion.div variants={fadeUp} className="overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                  Milestone
                </th>
                <th className="text-center py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                  All Shows (Median)
                </th>
                <th className="text-center py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                  All Shows (Mean)
                </th>
                <th className="text-center py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                  Sold Out (Median)
                </th>
                <th className="text-center py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                  Not Sold Out (Median)
                </th>
              </tr>
            </thead>
            <tbody>
              {benchmark.pacingBenchmarks.map((pb, idx) => (
                <tr
                  key={idx}
                  className="border-b border-surface-100 hover:bg-surface-50/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <p className="font-semibold text-text-primary">{pb.milestone}</p>
                    <p className="text-xs text-text-muted">{pb.daysOut} days out</p>
                  </td>
                  <td className="text-center py-3 px-4 text-text-primary font-semibold">
                    {formatPct(pb.allShowsMedian)}
                  </td>
                  <td className="text-center py-3 px-4 text-text-secondary">
                    {formatPct(pb.allShowsMean)}
                  </td>
                  <td className="text-center py-3 px-4 text-tier-green font-semibold">
                    {pb.soldOutMedian ? formatPct(pb.soldOutMedian) : '—'}
                  </td>
                  <td className="text-center py-3 px-4 text-text-secondary">
                    {pb.notSoldOutMedian ? formatPct(pb.notSoldOutMedian) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Multiplier table */}
      <motion.div variants={fadeUp} className="space-y-4">
        <h3 className="font-heading text-lg font-bold text-text-primary">Day-Out Multipliers</h3>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                  Days Out
                </th>
                <th className="text-center py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                  Median Multiplier
                </th>
                <th className="text-center py-3 px-4 text-text-muted uppercase text-xs tracking-wider font-semibold">
                  Sample Size
                </th>
              </tr>
            </thead>
            <tbody>
              {benchmark.multipliers.map((multiplier, idx) => (
                <tr
                  key={idx}
                  className="border-b border-surface-100 hover:bg-surface-50/40 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-text-primary">
                    {multiplier.daysOut} days
                  </td>
                  <td className="text-center py-3 px-4 text-accent font-bold">
                    {multiplier.medianMultiplier.toFixed(2)}x
                  </td>
                  <td className="text-center py-3 px-4 text-text-muted">
                    {multiplier.sampleSize} shows
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Historical shows */}
      {benchmark.shows.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-4">
          <h3 className="font-heading text-lg font-bold text-text-primary">Historical Shows</h3>
          <div className="space-y-3">
            {benchmark.shows.map((show, idx) => (
              <BenchmarkShowCard
                key={idx}
                show={show}
                isExpanded={expandedShow === `${idx}`}
                onToggle={() => setExpandedShow(expandedShow === `${idx}` ? null : `${idx}`)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function SummaryCard({
  label,
  value,
  format,
  variants,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  variants: any;
}) {
  return (
    <motion.div
      variants={variants}
      className="p-5 rounded-xl border border-surface-200 bg-surface-50/80 backdrop-blur-sm"
    >
      <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-2">{label}</p>
      <p className="font-heading text-2xl font-bold text-text-primary">{format(value)}</p>
    </motion.div>
  );
}

function BenchmarkShowCard({
  show,
  isExpanded,
  onToggle,
}: {
  show: {
    city: string;
    venue: string;
    capacity: number;
    finalPctSold: number;
    soldOut: boolean;
    pacingAtMilestones: { milestone: string; pctSold: number }[];
  };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      className="rounded-xl border border-surface-200 bg-surface-50/80 overflow-hidden backdrop-blur-sm"
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-surface-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <h4 className="font-heading font-bold text-text-primary">
              {show.city}
              {show.soldOut && (
                <span className="ml-2 inline text-xs font-body text-tier-green">SOLD OUT</span>
              )}
            </h4>
            <p className="text-xs sm:text-sm text-text-muted font-body mt-1">{show.venue}</p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-text-secondary flex-shrink-0"
          >
            ▼
          </motion.div>
        </div>
        <p className="text-sm text-text-secondary font-body mt-2">
          {formatNumber(Math.round(show.capacity * show.finalPctSold))} /{' '}
          {formatNumber(show.capacity)} • {formatPct(show.finalPctSold)}
        </p>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-surface-200 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {show.pacingAtMilestones.map((pacing, idx) => (
                  <div key={idx}>
                    <p className="font-body text-xs text-text-muted uppercase mb-1">
                      {pacing.milestone}
                    </p>
                    <p className="font-semibold text-text-primary">
                      {formatPct(pacing.pctSold)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
