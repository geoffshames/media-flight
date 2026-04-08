'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
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
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.55, 0.85]);

  const tierSummary = [
    { count: data.summary.tierCounts.green, label: 'Sold Out' },
    { count: data.summary.tierCounts.yellow, label: 'On Pace' },
    { count: data.summary.tierCounts.orange, label: 'Needs Push' },
    { count: data.summary.tierCounts.red, label: 'Critical' },
  ].filter((t) => t.count > 0);

  const sellThrough = Math.round(data.summary.avgSellThrough * 1000) / 10;

  return (
    <motion.div
      ref={heroRef}
      initial={false}
      animate="visible"
      variants={stagger}
      className="relative w-full overflow-hidden bg-surface min-h-[85vh] flex items-end"
    >
      {/* Parallax background image */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: imageY, scale: imageScale }}
      >
        <Image
          src={data.images.hero}
          alt={`${data.artist} ${data.tourName}`}
          fill
          className="object-cover object-center blur-[6px] scale-[1.05]"
          priority
          quality={90}
        />
      </motion.div>

      {/* Dark gradient overlay */}
      <motion.div
        className="absolute inset-0 z-[1] bg-gradient-to-t from-surface via-surface/70 to-transparent"
        style={{ opacity: overlayOpacity }}
      />
      {/* Bottom fade for seamless blend into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 z-[2] bg-gradient-to-t from-surface to-transparent" />

      {/* Content overlay */}
      <div className="relative z-10 w-full pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Top row: Artist + sell-through */}
          <div className="flex items-end justify-between gap-8 mb-6">
            <motion.div variants={fadeUp}>
              <h1 className="font-heading text-7xl md:text-8xl lg:text-[8rem] font-bold text-text-primary leading-[0.9] tracking-tight drop-shadow-2xl">
                {data.artist}
              </h1>
              <div className="mt-3 flex items-center gap-4">
                <p className="font-body text-xl md:text-2xl text-text-secondary font-light drop-shadow-lg">
                  {data.tourName}
                </p>
                <span className="text-surface-300 text-xl">·</span>
                <p className="font-body text-lg text-text-muted drop-shadow-lg">
                  {data.legName}
                </p>
              </div>
              <p className="font-body text-sm text-text-muted mt-1 drop-shadow-lg">
                {data.dateRange}
              </p>
            </motion.div>

            {/* Large sell-through stat */}
            <motion.div variants={fadeUp} className="hidden md:flex flex-col items-end">
              <p className="font-heading text-6xl lg:text-7xl font-bold text-text-primary leading-none drop-shadow-2xl">
                <AnimatedNumber value={sellThrough} format={(n) => `${n.toFixed(1)}%`} />
              </p>
              <p className="font-body text-sm text-text-muted uppercase tracking-[0.12em] mt-1 drop-shadow-lg">
                Sell-Through
              </p>
            </motion.div>
          </div>

          {/* Stats grid — glass cards over the image */}
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
      className={`p-4 rounded-xl border backdrop-blur-md ${
        accent
          ? 'border-accent/30 bg-accent/[0.12]'
          : 'border-white/10 bg-surface/60'
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
