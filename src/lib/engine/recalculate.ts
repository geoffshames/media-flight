/**
 * Orchestrates the full recalculation pipeline:
 * parse uploaded file → update markets → repredict → recompute summary → build diff
 */
import type {
  FlightPlan, Market, DiffSummary, PredictionSnapshot, CalibrationData,
} from '@/lib/types/flight';
import { parseUploadedFile } from './parser';
import { repredictAllMarkets } from './predictor';

interface RecalculateResult {
  updatedPlan: FlightPlan;
  diff: DiffSummary;
  snapshot: PredictionSnapshot;
  parseWarnings: string[];
}

export function recalculateFromUpload(
  original: FlightPlan,
  fileBuffer: ArrayBuffer,
  filename: string,
  calibration?: CalibrationData | null,
): RecalculateResult {
  // 1. Parse
  const parseResult = parseUploadedFile(fileBuffer, original.markets);

  // 2. Build update map
  const updateMap = new Map<string, number>();
  for (const u of parseResult.updates) {
    // Match to existing market
    const market = original.markets.find(m =>
      m.city.toLowerCase() === u.city.toLowerCase()
    );
    if (market) {
      updateMap.set(`${market.city}-${market.showDate}`, u.ticketsSold);
    }
  }

  // 3. Repredict
  const updatedMarkets = repredictAllMarkets(original.markets, updateMap, {
    calibration,
    benchmark: original.benchmark,
    cptRates: original.cptRates,
  });

  // 4. Recompute summary
  const onSaleMarkets = updatedMarkets.filter(m => m.status !== 'played');
  const totalSold = onSaleMarkets.reduce((s, m) => s + m.ticketsSold, 0);
  const totalCapacity = onSaleMarkets.reduce((s, m) => s + m.capacity, 0);
  const totalGap = onSaleMarkets.reduce((s, m) => s + m.prediction.gap, 0);

  const tierCounts = { green: 0, yellow: 0, orange: 0, red: 0 };
  for (const m of onSaleMarkets) {
    const t = m.prediction.tier;
    if (t.startsWith('green')) tierCounts.green++;
    else if (t === 'yellow') tierCounts.yellow++;
    else if (t === 'orange') tierCounts.orange++;
    else if (t === 'red') tierCounts.red++;
  }

  const updatedPlan: FlightPlan = {
    ...original,
    markets: updatedMarkets,
    summary: {
      totalMarkets: onSaleMarkets.length,
      totalCapacity,
      totalSold,
      avgSellThrough: totalCapacity > 0 ? totalSold / totalCapacity : 0,
      totalPredictedGap: totalGap,
      budgetRecommendations: original.cptRates.map(rate => ({
        rate,
        totalBudget: onSaleMarkets.reduce((s, m) => {
          const b = m.prediction.budgets.find(b => b.rate === rate);
          return s + (b?.amount ?? 0);
        }, 0),
      })),
      tierCounts,
    },
  };

  // 5. Build diff
  const diff = buildDiffSummary(original, updatedPlan, filename);

  // 6. Capture snapshot
  const snapshot = captureSnapshot(updatedPlan, filename, calibration);

  return {
    updatedPlan,
    diff,
    snapshot,
    parseWarnings: parseResult.warnings,
  };
}

function buildDiffSummary(
  original: FlightPlan,
  updated: FlightPlan,
  filename: string,
): DiffSummary {
  const timestamp = new Date().toISOString();
  let marketsUpdated = 0;

  const movers: DiffSummary['biggestMovers'] = [];
  const tierChanges: DiffSummary['tierChanges'] = [];

  for (let i = 0; i < original.markets.length; i++) {
    const orig = original.markets[i];
    const upd = updated.markets[i];
    if (!upd || orig.ticketsSold === upd.ticketsSold) continue;

    marketsUpdated++;
    const delta = upd.pctSold - orig.pctSold;
    movers.push({
      city: orig.city,
      previousPct: orig.pctSold,
      newPct: upd.pctSold,
      deltaPct: delta,
    });

    if (orig.prediction.tier !== upd.prediction.tier) {
      tierChanges.push({
        city: orig.city,
        previousTier: orig.prediction.tierLabel,
        newTier: upd.prediction.tierLabel,
      });
    }
  }

  // Sort movers by absolute delta, take top 3
  movers.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  const biggestMovers = movers.slice(0, 3);

  const budgetChange = original.cptRates.map(rate => {
    const prevBudget = original.summary.budgetRecommendations.find(b => b.rate === rate)?.totalBudget ?? 0;
    const newBudget = updated.summary.budgetRecommendations.find(b => b.rate === rate)?.totalBudget ?? 0;
    return { rate, previousTotal: prevBudget, newTotal: newBudget, delta: newBudget - prevBudget };
  });

  return {
    filename,
    timestamp,
    marketsUpdated,
    marketsTotal: original.markets.length,
    biggestMovers,
    tierChanges,
    budgetChange,
    overallSellThroughChange: updated.summary.avgSellThrough - original.summary.avgSellThrough,
  };
}

function captureSnapshot(
  plan: FlightPlan,
  sourceFile: string,
  calibration?: CalibrationData | null,
): PredictionSnapshot {
  return {
    id: crypto.randomUUID(),
    flightSlug: plan.slug,
    timestamp: new Date().toISOString(),
    source: 'upload_widget',
    sourceFile,
    markets: plan.markets
      .filter(m => m.status !== 'played')
      .map(m => ({
        city: m.city,
        showDate: m.showDate,
        daysOut: m.daysOut,
        ticketsSold: m.ticketsSold,
        pctSold: m.pctSold,
        predictedFinalPct: m.prediction.blendedPredPct,
        predictedFinalSold: m.prediction.predictedSold,
        tier: m.prediction.tier,
        confidence: m.prediction.confidence,
      })),
    modelParams: {
      velocityWeight: calibration?.weights.velocityWeight ?? 0.5,
      multiplierWeight: calibration?.weights.multiplierWeight ?? 0.5,
      surgeMultiplier: calibration?.surgeMultiplier ?? 1.5,
      calibrationApplied: !!calibration,
    },
  };
}
