import { Market, MarketPrediction, BenchmarkData, CalibrationData } from '@/lib/types/flight';

const DEFAULT_VELOCITY_WEIGHT = 0.5;
const DEFAULT_MULTIPLIER_WEIGHT = 0.5;
const DEFAULT_SURGE_MULTIPLIER = 1.5;

interface PredictorConfig {
  calibration?: CalibrationData | null;
  benchmark?: BenchmarkData | null;
  cptRates: number[];
}

/**
 * Runs the blended prediction model for a single market.
 * Mirrors the Python logic from SKILL.md Phase 4.
 */
export function predictMarket(
  market: Omit<Market, 'prediction' | 'pacingNote'>,
  config: PredictorConfig
): MarketPrediction {
  const { calibration, benchmark, cptRates } = config;

  const velocityWeight = calibration?.weights.velocityWeight ?? DEFAULT_VELOCITY_WEIGHT;
  const multiplierWeight = calibration?.weights.multiplierWeight ?? DEFAULT_MULTIPLIER_WEIGHT;
  const surgeMultiplier = calibration?.surgeMultiplier ?? DEFAULT_SURGE_MULTIPLIER;

  // Method 1: Velocity extrapolation
  const blendedVelocity = 0.6 * market.recentWeeklyVelocity + 0.4 * market.avgWeeklyVelocity;
  const weeksRemaining = Math.max(0, market.daysOut / 7);
  const regularWeeks = Math.max(0, weeksRemaining - 1);
  const velocityProjected = market.ticketsSold + (blendedVelocity * regularWeeks) + (blendedVelocity * surgeMultiplier);
  let velocityPredPct = Math.min(1, velocityProjected / market.capacity);

  // Method 2: Benchmark multiplier (if available)
  let multiplierPredPct: number | undefined;
  if (benchmark && benchmark.multipliers.length > 0) {
    const closest = benchmark.multipliers.reduce((prev, curr) =>
      Math.abs(curr.daysOut - market.daysOut) < Math.abs(prev.daysOut - market.daysOut) ? curr : prev
    );
    multiplierPredPct = Math.min(1, market.pctSold * closest.medianMultiplier);
  }

  // Blend
  let blendedPredPct: number;
  if (multiplierPredPct !== undefined) {
    if (market.pctSold < 0.5) {
      blendedPredPct = 0.6 * velocityPredPct + 0.4 * multiplierPredPct;
    } else {
      blendedPredPct = velocityWeight * velocityPredPct + multiplierWeight * multiplierPredPct;
    }
  } else {
    blendedPredPct = velocityPredPct;
  }

  // Apply bias correction from calibration
  if (calibration) {
    if (market.pctSold < 0.5) {
      blendedPredPct += calibration.biasCorrections.below50pct;
    } else if (market.pctSold < 0.75) {
      blendedPredPct += calibration.biasCorrections['50to75pct'];
    } else {
      blendedPredPct += calibration.biasCorrections.above75pct;
    }
  }

  blendedPredPct = Math.max(0, Math.min(1, blendedPredPct));
  const predictedSold = Math.round(blendedPredPct * market.capacity);
  const gap = Math.max(0, market.capacity - predictedSold);

  const budgets = cptRates.map(rate => ({
    rate,
    amount: Math.round(gap * rate),
  }));

  const requiredWeeklyVelocity = weeksRemaining > 0
    ? (market.capacity - market.ticketsSold) / weeksRemaining
    : 0;
  const velocityGap = requiredWeeklyVelocity - market.recentWeeklyVelocity;

  // Tier assignment
  const tier = assignTier(market.pctSold, blendedPredPct, market.status);

  // Confidence
  const confidence = assessConfidence(market, benchmark);

  return {
    velocityPredPct,
    multiplierPredPct,
    blendedPredPct,
    predictedSold,
    gap,
    confidence,
    budgets,
    requiredWeeklyVelocity: Math.round(requiredWeeklyVelocity),
    velocityGap: Math.round(velocityGap),
    weeksRemaining: Math.round(weeksRemaining * 10) / 10,
    tier,
    tierLabel: getTierLabel(tier),
    tierColor: getTierColor(tier),
  };
}

function assignTier(
  pctSold: number,
  predictedPct: number,
  status: string
): MarketPrediction['tier'] {
  if (status === 'sold_out' || pctSold >= 1) return 'green_sold_out';
  if (predictedPct >= 0.95) return 'green_on_pace';
  if (predictedPct >= 0.75) return 'yellow';
  if (predictedPct >= 0.50) return 'orange';
  return 'red';
}

function getTierLabel(tier: string): string {
  switch (tier) {
    case 'green_sold_out': return 'GREEN — SOLD OUT';
    case 'green_on_pace': return 'GREEN — ON PACE';
    case 'yellow': return 'YELLOW — NEEDS PUSH';
    case 'orange': return 'ORANGE — AT RISK';
    case 'red': return 'RED — CRITICAL';
    default: return 'UNKNOWN';
  }
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'green_sold_out':
    case 'green_on_pace': return '#00E676';
    case 'yellow': return '#FFD600';
    case 'orange': return '#FF9100';
    case 'red': return '#FF1744';
    default: return '#333333';
  }
}

function assessConfidence(
  market: Omit<Market, 'prediction' | 'pacingNote'>,
  benchmark?: BenchmarkData | null
): 'high' | 'medium' | 'low' {
  const snapshotCount = market.pacingHistory?.length ?? 0;
  const hasStableVelocity = market.velocityTrend === 'steady' || market.velocityTrend === 'accelerating';
  const hasBenchmark = !!benchmark && benchmark.multipliers.length > 0;

  if (snapshotCount >= 4 && hasBenchmark && hasStableVelocity) return 'high';
  if (snapshotCount >= 2) return 'medium';
  return 'low';
}

/**
 * Re-predict all markets with updated ticket counts.
 */
export function repredictAllMarkets(
  markets: Market[],
  updatedCounts: Map<string, number>,
  config: PredictorConfig
): Market[] {
  return markets.map(market => {
    const key = `${market.city}-${market.showDate}`;
    const newSold = updatedCounts.get(key);

    if (newSold === undefined || market.status === 'played') return market;

    const updatedMarket = {
      ...market,
      ticketsSold: newSold,
      pctSold: newSold / market.capacity,
      daysOut: Math.max(0, Math.floor((new Date(market.showDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    };

    // Recalculate velocity if we have new data
    const newSnapshot = {
      date: new Date().toISOString().split('T')[0],
      ticketsSold: newSold,
      pctSold: newSold / market.capacity,
      daysOut: updatedMarket.daysOut,
    };

    const pacingHistory = [...market.pacingHistory, newSnapshot];

    // Recalculate velocities from history
    let recentWeeklyVelocity = market.recentWeeklyVelocity;
    let avgWeeklyVelocity = market.avgWeeklyVelocity;

    if (pacingHistory.length >= 2) {
      const last = pacingHistory[pacingHistory.length - 1];
      const prev = pacingHistory[pacingHistory.length - 2];
      const daysDiff = Math.max(1, prev.daysOut - last.daysOut);
      recentWeeklyVelocity = Math.round(((last.ticketsSold - prev.ticketsSold) / daysDiff) * 7);

      const velocities: number[] = [];
      for (let i = 1; i < pacingHistory.length; i++) {
        const dd = Math.max(1, pacingHistory[i - 1].daysOut - pacingHistory[i].daysOut);
        velocities.push(((pacingHistory[i].ticketsSold - pacingHistory[i - 1].ticketsSold) / dd) * 7);
      }
      avgWeeklyVelocity = Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length);
    }

    const velocityTrend: Market['velocityTrend'] =
      recentWeeklyVelocity > avgWeeklyVelocity * 1.15 ? 'accelerating' :
      recentWeeklyVelocity < avgWeeklyVelocity * 0.85 ? 'decelerating' : 'steady';

    const marketForPrediction = {
      ...updatedMarket,
      pacingHistory,
      recentWeeklyVelocity,
      avgWeeklyVelocity,
      velocityTrend,
    };

    const prediction = predictMarket(marketForPrediction, config);
    const pacingNote = generatePacingNote(marketForPrediction, prediction);

    return {
      ...marketForPrediction,
      prediction,
      pacingNote,
    };
  });
}

function generatePacingNote(
  market: Omit<Market, 'prediction' | 'pacingNote'>,
  prediction: MarketPrediction
): string {
  if (prediction.tier === 'green_sold_out') return 'Sold out. No action needed.';
  if (prediction.tier === 'green_on_pace')
    return `On pace at ${(prediction.blendedPredPct * 100).toFixed(0)}% predicted. Monitor only.`;
  if (prediction.tier === 'yellow')
    return `Predicted ${(prediction.blendedPredPct * 100).toFixed(0)}%. Light push recommended — ${prediction.gap} tickets to close.`;
  if (prediction.tier === 'orange')
    return `At risk — predicted ${(prediction.blendedPredPct * 100).toFixed(0)}%. Needs ${Math.round(prediction.requiredWeeklyVelocity)} tickets/week (currently ${market.recentWeeklyVelocity}).`;
  return `Critical — predicted ${(prediction.blendedPredPct * 100).toFixed(0)}%. Gap of ${prediction.gap} tickets with ${prediction.weeksRemaining} weeks remaining.`;
}
