'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { allFlightPlans } from '@/lib/data';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { SectionDivider } from '@/components/common/SectionDivider';
import { useInView } from '@/hooks/useInView';

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

export default function Home() {
  const { ref, inView } = useInView();
  const flights = Object.values(allFlightPlans);

  return (
    <>
      <Navigation />
      <main className="w-full bg-surface min-h-screen">
        {/* Hero section */}
        <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-surface-100 via-surface to-surface pt-32 px-4 sm:px-6 lg:px-8 flex items-center">
          {/* Accent orbs */}
          <div className="absolute top-40 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent/3 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-display text-5xl md:text-7xl font-bold text-text-primary mb-6"
            >
              Media Flight
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12"
            >
              Data-driven tour pacing analysis and media budget recommendations. Powered by
              Crowd Control Digital.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="text-text-muted font-body text-sm">
                Select a tour below to explore
              </div>
            </motion.div>
          </div>
        </section>

        <SectionDivider />

        {/* Flight plans grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={stagger}
            className="space-y-6"
          >
            <motion.h2
              variants={fadeUp}
              className="font-display text-3xl md:text-4xl font-bold text-text-primary"
            >
              Flight Plans
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flights.map((flight, idx) => (
                <FlightCard key={flight.slug} flight={flight} delay={idx * 0.08} />
              ))}
            </div>

            {flights.length === 0 && (
              <motion.div
                variants={fadeUp}
                className="text-center py-12 text-text-secondary font-body"
              >
                No flight plans available yet.
              </motion.div>
            )}
          </motion.div>
        </section>

        <SectionDivider />

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}

function FlightCard({ flight, delay }: { flight: (typeof allFlightPlans)[string]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Link href={`/flight/${flight.slug}`}>
        <motion.div
          whileHover={{ y: -8 }}
          className="h-full p-6 sm:p-8 rounded-lg border border-surface-200 bg-surface-50/50 backdrop-blur-sm
            hover:border-accent/30 hover:bg-surface-50/70 transition-all duration-300 cursor-pointer
            flex flex-col justify-between"
        >
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              {flight.artist}
            </h3>
            <p className="font-body text-text-secondary mb-1">{flight.tourName}</p>
            <p className="font-body text-sm text-text-muted">{flight.legName}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-surface-200 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-1">
                  Markets
                </p>
                <p className="font-display font-bold text-text-primary">
                  {flight.summary.totalMarkets}
                </p>
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-wider text-text-muted mb-1">
                  Sell-Through
                </p>
                <p className="font-display font-bold text-text-primary">
                  {(flight.summary.avgSellThrough * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="font-body text-xs text-accent font-semibold">
                View Analysis →
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
