'use client';
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
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-8">
            Market Overview
          </h2>
          <MarketOverview markets={flight.markets} />
        </section>

        <SectionDivider />

        {/* Pacing Chart */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-8">
            Sales Pacing Timeline
          </h2>
          <PacingChart markets={flight.markets} benchmark={flight.benchmark} />
        </section>

        <SectionDivider />

        {/* Budget Matrix */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-8">
            Budget Analysis
          </h2>
          <BudgetMatrix markets={flight.markets} cptRates={flight.cptRates} />
        </section>

        <SectionDivider />

        {/* Market Deep Dives */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-8">
            Market Deep Dives
          </h2>
          <MarketDeepDives
            markets={flight.markets}
            cptRates={flight.cptRates}
            benchmark={flight.benchmark}
          />
        </section>

        <SectionDivider />

        {/* Predictions */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <PredictionModel markets={flight.markets} />
        </section>

        <SectionDivider />

        {/* Benchmark Comparison (if available) */}
        {flight.benchmark && (
          <>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-8">
                Benchmark Comparison
              </h2>
              <BenchmarkComparison benchmark={flight.benchmark} />
            </section>

            <SectionDivider />
          </>
        )}

        {/* Methodology */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <Methodology methodology={flight.methodology} />
        </section>

        <SectionDivider />

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}
