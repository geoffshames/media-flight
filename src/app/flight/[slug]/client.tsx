'use client';
import { motion } from 'framer-motion';
import { FlightPlan } from '@/lib/types/flight';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { FlightHero } from '@/components/flight/FlightHero';
import { MarketOverview } from '@/components/flight/MarketOverview';
import { PacingChart } from '@/components/flight/PacingChart';
import { BudgetMatrix } from '@/components/flight/BudgetMatrix';
import { MarketDeepDives } from '@/components/flight/MarketDeepDives';
import { BenchmarkComparison } from '@/components/flight/BenchmarkComparison';
import { Methodology } from '@/components/flight/Methodology';
import { PredictionModel } from '@/components/flight/PredictionModel';
import { SectionDivider } from '@/components/common/SectionDivider';

interface FlightClientProps {
  flight: FlightPlan;
}

const sectionHeaderVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={sectionHeaderVariants}
      className="mb-8"
    >
      <div className="flex items-baseline gap-4">
        <span className="font-heading text-2xl md:text-3xl font-bold text-accent tracking-[0.2em]">
          {number}
        </span>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
          {title}
        </h2>
      </div>
      <div className="h-px bg-gradient-to-r from-accent via-accent/30 to-transparent mt-4 origin-left" />
    </motion.div>
  );
}

export function FlightClient({ flight }: FlightClientProps) {
  return (
    <>
      <Navigation />
      <main className="w-full bg-surface min-h-screen">
        {/* Hero section */}
        <section className="w-full">
          <FlightHero data={flight} />
        </section>

        <SectionDivider />

        {/* Market Overview */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <SectionHeader number="01" title="Market Overview" />
          <MarketOverview markets={flight.markets} />
        </section>

        <SectionDivider />

        {/* Pacing Chart */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <SectionHeader number="02" title="Sales Pacing Timeline" />
          <PacingChart markets={flight.markets} benchmark={flight.benchmark} />
        </section>

        <SectionDivider />

        {/* Budget Matrix */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <SectionHeader number="03" title="Budget Analysis" />
          <BudgetMatrix markets={flight.markets} cptRates={flight.cptRates} />
        </section>

        <SectionDivider />

        {/* Market Deep Dives */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <SectionHeader number="04" title="Market Deep Dives" />
          <MarketDeepDives
            markets={flight.markets}
            cptRates={flight.cptRates}
            benchmark={flight.benchmark}
          />
        </section>

        <SectionDivider />

        {/* Predictions */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <SectionHeader number="05" title="Predictions" />
          <PredictionModel markets={flight.markets} />
        </section>

        <SectionDivider />

        {/* Benchmark Comparison (if available) */}
        {flight.benchmark && (
          <>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
              <SectionHeader number="06" title="Benchmark Comparison" />
              <BenchmarkComparison benchmark={flight.benchmark} />
            </section>

            <SectionDivider />
          </>
        )}

        {/* Methodology */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <SectionHeader number={flight.benchmark ? '07' : '06'} title="Methodology" />
          <Methodology methodology={flight.methodology} />
        </section>

        <SectionDivider />

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}
