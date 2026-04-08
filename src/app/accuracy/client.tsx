'use client';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/common/GlassCard';
import { SectionDivider } from '@/components/common/SectionDivider';
import type { AccuracyRecord, CalibrationData, CalibrationChange } from '@/lib/types/flight';

interface AccuracyClientProps {
  records: AccuracyRecord[];
  calibration: CalibrationData;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <motion.div initial={false} animate="visible" variants={fadeUp} className="mb-8">
      <div className="flex items-baseline gap-4">
        <span className="font-heading text-2xl md:text-3xl font-bold text-accent tracking-[0.2em]">{number}</span>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">{title}</h2>
      </div>
      <div className="h-px bg-gradient-to-r from-accent via-accent/30 to-transparent mt-4" />
    </motion.div>
  );
}

export function AccuracyClient({ records, calibration }: AccuracyClientProps) {
  const hasData = records.length > 0;

  // Aggregate metrics
  const overallMape = hasData
    ? records.reduce((s, r) => s + r.metrics.mape, 0) / records.length
    : null;
  const overallTierAccuracy = hasData
    ? records.reduce((s, r) => s + r.metrics.tierAccuracy, 0) / records.length
    : null;
  const totalMarkets = records.reduce((s, r) => s + r.marketsChecked, 0);
  const uniqueTours = new Set(records.map(r => r.flightSlug)).size;

  // Group by days-out brackets for the bar chart
  const daysOutBrackets = [
    { label: '0-7', min: 0, max: 7 },
    { label: '7-14', min: 7, max: 14 },
    { label: '14-30', min: 14, max: 30 },
    { label: '30-60', min: 30, max: 60 },
    { label: '60-90', min: 60, max: 90 },
    { label: '90-120', min: 90, max: 120 },
    { label: '120+', min: 120, max: Infinity },
  ];

  const allDetails = records.flatMap(r => r.marketDetails);
  const bracketData = daysOutBrackets.map(b => {
    const inBracket = allDetails.filter(d => d.daysOutAtPrediction >= b.min && d.daysOutAtPrediction < b.max);
    const mape = inBracket.length > 0
      ? inBracket.reduce((s, d) => s + Math.abs(d.error), 0) / inBracket.length
      : 0;
    return { bracket: b.label, mape, count: inBracket.length };
  });

  // Scatter data for bias analysis
  const scatterData = allDetails.map(d => ({
    predicted: d.predictedPct * 100,
    actual: d.actualPct * 100,
    city: d.city,
    tier: d.tierPredicted,
  }));

  // Timeline data
  const timelineData = records.map(r => ({
    date: r.checkDate,
    mape: r.metrics.mape * 100,
    bias: r.metrics.bias * 100,
    tierAccuracy: r.metrics.tierAccuracy * 100,
    calibrated: r.calibrationApplied,
  }));

  const bracketColors = ['#00E676', '#00E676', '#FFD600', '#FFD600', '#FF9100', '#FF9100', '#FF1744'];

  return (
    <>
      <Navigation />
      <main className="w-full bg-surface min-h-screen pt-16">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div initial={false} animate="visible" variants={stagger}>
            <motion.h1 variants={fadeUp} className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-4">
              Model Accuracy
            </motion.h1>
            <motion.p variants={fadeUp} className="text-text-muted text-lg max-w-2xl mb-12">
              Tracking prediction performance across all tours. This page measures how well the
              media flight prediction model performs and how it improves over time through calibration.
            </motion.p>
          </motion.div>
        </section>

        <SectionDivider />

        {/* Section 1: Model Health Overview */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <SectionHeader number="01" title="Model Health" />

          {!hasData ? (
            <EmptyState />
          ) : (
            <motion.div initial={false} animate="visible" variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard hover={false}>
                <p className="text-text-muted text-xs tracking-wider uppercase mb-2">Overall MAPE</p>
                <p className="text-text-primary text-3xl font-heading font-bold">
                  {overallMape !== null ? `${(overallMape * 100).toFixed(1)}%` : '—'}
                </p>
                <p className="text-text-muted text-xs mt-1">Lower is better</p>
              </GlassCard>

              <GlassCard hover={false}>
                <p className="text-text-muted text-xs tracking-wider uppercase mb-2">Tier Accuracy</p>
                <p className="text-text-primary text-3xl font-heading font-bold">
                  {overallTierAccuracy !== null ? `${(overallTierAccuracy * 100).toFixed(0)}%` : '—'}
                </p>
                <p className="text-text-muted text-xs mt-1">Correct tier assignments</p>
              </GlassCard>

              <GlassCard hover={false}>
                <p className="text-text-muted text-xs tracking-wider uppercase mb-2">Markets Tracked</p>
                <p className="text-text-primary text-3xl font-heading font-bold">{totalMarkets}</p>
                <p className="text-text-muted text-xs mt-1">Across {uniqueTours} tour{uniqueTours !== 1 ? 's' : ''}</p>
              </GlassCard>

              <GlassCard hover={false}>
                <p className="text-text-muted text-xs tracking-wider uppercase mb-2">Calibration</p>
                <p className="text-text-primary text-xl font-heading font-bold">
                  {calibration.sampleSize > 0
                    ? <span className="text-tier-green">Active</span>
                    : <span className="text-text-muted">Defaults</span>
                  }
                </p>
                <p className="text-text-muted text-xs mt-1">
                  {calibration.sampleSize > 0 ? `${calibration.sampleSize} markets` : 'No data yet'}
                </p>
              </GlassCard>
            </motion.div>
          )}
        </section>

        {hasData && (
          <>
            <SectionDivider />

            {/* Section 2: Accuracy Over Time */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
              <SectionHeader number="02" title="Accuracy Over Time" />
              <GlassCard hover={false} className="p-6">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={timelineData}>
                    <CartesianGrid stroke="#333333" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#D4D4D8" tick={{ fill: '#D4D4D8', fontSize: 12 }} />
                    <YAxis stroke="#D4D4D8" tick={{ fill: '#D4D4D8', fontSize: 12 }} unit="%" />
                    <Tooltip
                      contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8 }}
                      labelStyle={{ color: '#FAFAFA' }}
                    />
                    <ReferenceLine y={10} stroke="#FFD600" strokeDasharray="5 5" label={{ value: 'Target', fill: '#FFD600', fontSize: 11 }} />
                    <Line type="monotone" dataKey="mape" stroke="#FD3737" strokeWidth={2} dot={{ fill: '#FD3737', r: 4 }} name="MAPE %" />
                    <Line type="monotone" dataKey="tierAccuracy" stroke="#00E676" strokeWidth={2} dot={{ fill: '#00E676', r: 4 }} name="Tier Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>
            </section>

            <SectionDivider />

            {/* Section 3: Accuracy by Days Out */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
              <SectionHeader number="03" title="Accuracy by Days Out" />
              <GlassCard hover={false} className="p-6">
                <p className="text-text-muted text-sm mb-4">
                  Predictions made closer to show date should be more accurate. This chart shows
                  Mean Absolute Percentage Error grouped by how far out the prediction was made.
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={bracketData}>
                    <CartesianGrid stroke="#333333" strokeDasharray="3 3" />
                    <XAxis dataKey="bracket" stroke="#D4D4D8" tick={{ fill: '#D4D4D8', fontSize: 12 }} label={{ value: 'Days Out', fill: '#D4D4D8', position: 'insideBottom', offset: -5 }} />
                    <YAxis stroke="#D4D4D8" tick={{ fill: '#D4D4D8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8 }}
                      labelStyle={{ color: '#FAFAFA' }}
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'MAPE']}
                    />
                    <Bar dataKey="mape" radius={[4, 4, 0, 0]}>
                      {bracketData.map((_, i) => (
                        <Cell key={i} fill={bracketColors[i]} fillOpacity={0.7} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </section>

            <SectionDivider />

            {/* Section 4: Bias Analysis */}
            {scatterData.length > 0 && (
              <>
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                  <SectionHeader number="04" title="Bias Analysis" />
                  <GlassCard hover={false} className="p-6">
                    <p className="text-text-muted text-sm mb-4">
                      Each dot is one market prediction. Points on the diagonal are perfect predictions.
                      Points above the line mean the model overpredicted; below means underpredicted.
                    </p>
                    <ResponsiveContainer width="100%" height={320}>
                      <ScatterChart>
                        <CartesianGrid stroke="#333333" strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="predicted" stroke="#D4D4D8" tick={{ fill: '#D4D4D8', fontSize: 12 }} name="Predicted %" unit="%" domain={[0, 100]} />
                        <YAxis type="number" dataKey="actual" stroke="#D4D4D8" tick={{ fill: '#D4D4D8', fontSize: 12 }} name="Actual %" unit="%" domain={[0, 100]} />
                        <ZAxis range={[40, 40]} />
                        <Tooltip
                          contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 8 }}
                          labelStyle={{ color: '#FAFAFA' }}
                          formatter={(value: number) => `${value.toFixed(1)}%`}
                        />
                        <ReferenceLine
                          segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                          stroke="#FD3737"
                          strokeDasharray="5 5"
                          strokeOpacity={0.5}
                        />
                        <Scatter data={scatterData} fill="#FD3737" fillOpacity={0.6} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </GlassCard>
                </section>
                <SectionDivider />
              </>
            )}

            {/* Section 5: Tour-by-Tour Breakdown */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
              <SectionHeader number="05" title="Tour Breakdown" />
              <TourBreakdown records={records} />
            </section>

            <SectionDivider />

            {/* Section 6: Calibration History */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
              <SectionHeader number="06" title="Calibration History" />
              <CalibrationHistory calibration={calibration} />
            </section>
          </>
        )}

        <SectionDivider />
        <Footer />
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <GlassCard hover={false} className="text-center py-16">
      <div className="text-5xl mb-4 opacity-30">📊</div>
      <h3 className="font-heading text-xl text-text-primary mb-2">No Accuracy Data Yet</h3>
      <p className="text-text-muted text-sm max-w-md mx-auto">
        Accuracy records will appear here as the media flight skill is re-run with updated ticket
        data. Each comparison between predictions and actual outcomes builds the accuracy dataset
        that drives model calibration.
      </p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="p-4 rounded-lg bg-surface-100 border border-surface-200">
          <p className="text-accent font-heading text-sm mb-1">Step 1</p>
          <p className="text-text-muted text-xs">Generate a media flight plan</p>
        </div>
        <div className="p-4 rounded-lg bg-surface-100 border border-surface-200">
          <p className="text-accent font-heading text-sm mb-1">Step 2</p>
          <p className="text-text-muted text-xs">Upload updated ticket data via the dashboard widget</p>
        </div>
        <div className="p-4 rounded-lg bg-surface-100 border border-surface-200">
          <p className="text-accent font-heading text-sm mb-1">Step 3</p>
          <p className="text-text-muted text-xs">Re-run the skill to compare predictions vs actuals</p>
        </div>
      </div>
    </GlassCard>
  );
}

function TourBreakdown({ records }: { records: AccuracyRecord[] }) {
  const byTour = new Map<string, AccuracyRecord[]>();
  for (const r of records) {
    const key = `${r.artist} — ${r.tourName} (${r.legName})`;
    if (!byTour.has(key)) byTour.set(key, []);
    byTour.get(key)!.push(r);
  }

  if (byTour.size === 0) {
    return <p className="text-text-muted text-sm">No tour data available yet.</p>;
  }

  return (
    <motion.div initial={false} animate="visible" variants={stagger} className="space-y-4">
      {Array.from(byTour.entries()).map(([tourKey, tourRecords]) => {
        const avgMape = tourRecords.reduce((s, r) => s + r.metrics.mape, 0) / tourRecords.length;
        const avgTier = tourRecords.reduce((s, r) => s + r.metrics.tierAccuracy, 0) / tourRecords.length;
        const totalChecked = tourRecords.reduce((s, r) => s + r.marketsChecked, 0);

        return (
          <GlassCard key={tourKey} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-text-primary font-heading text-lg font-bold">{tourKey}</h3>
                <p className="text-text-muted text-xs mt-1">{totalChecked} market checks · {tourRecords.length} comparison{tourRecords.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-text-muted text-xs">MAPE</p>
                  <p className="text-text-primary font-heading font-bold">{(avgMape * 100).toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-text-muted text-xs">Tier Accuracy</p>
                  <p className="text-text-primary font-heading font-bold">{(avgTier * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </motion.div>
  );
}

function CalibrationHistory({ calibration }: { calibration: CalibrationData }) {
  if (calibration.history.length === 0) {
    return (
      <GlassCard hover={false} className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-3 h-3 rounded-full bg-accent mt-1 flex-shrink-0" />
          <div>
            <p className="text-text-primary font-medium text-sm">{calibration.lastUpdated}</p>
            <p className="text-text-muted text-sm mt-1">{calibration.notes}</p>
            <div className="mt-3 flex gap-4 text-xs text-text-muted">
              <span>Velocity: {calibration.weights.velocityWeight}</span>
              <span>Multiplier: {calibration.weights.multiplierWeight}</span>
              <span>Surge: {calibration.surgeMultiplier}x</span>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {calibration.history.slice().reverse().map((change: CalibrationChange, i: number) => (
        <GlassCard key={i} hover={false} className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-3 h-3 rounded-full bg-accent" />
              {i < calibration.history.length - 1 && <div className="w-px h-full bg-surface-200 mt-1" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-text-primary font-medium text-sm">{change.date}</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-tier-red/10 text-tier-red">
                    {(change.mapeBeforeCalibration * 100).toFixed(1)}%
                  </span>
                  <span className="text-text-muted text-xs">→</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-tier-green/10 text-tier-green">
                    {(change.mapeAfterCalibration * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-text-muted text-xs">{change.trigger}</p>
              <p className="text-text-secondary text-xs mt-1 font-mono">{change.changes}</p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
