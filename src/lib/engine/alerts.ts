/**
 * Alert detection engine.
 * Compares original vs updated flight plan to detect:
 * 1. Tier drops — a market moved to a worse tier
 * 2. Velocity stalls — recent velocity dropped to near-zero for 3+ consecutive periods
 * 3. Show week urgency — market within 7 days of show and not projected to sell through
 */
import type { FlightPlan, Market, DiffSummary } from '@/lib/types/flight';

export type AlertType = 'tier_drop' | 'velocity_stall' | 'show_week_urgency';
export type AlertSeverity = 'warning' | 'critical';

export interface FlightAlert {
  type: AlertType;
  severity: AlertSeverity;
  market: string;
  showDate: string;
  daysOut: number;
  headline: string;
  detail: string;
  previousTier?: string;
  newTier?: string;
  currentPct: number;
  predictedPct: number;
  gap: number;
}

export interface AlertPayload {
  flightSlug: string;
  artist: string;
  tourName: string;
  legName: string;
  dashboardUrl: string;
  alerts: FlightAlert[];
  summaryStats: {
    marketsUpdated: number;
    totalMarkets: number;
    overallSellThrough: number;
    tierCounts: { green: number; yellow: number; orange: number; red: number };
  };
  recipients: string[];
  timestamp: string;
}

const TIER_RANK: Record<string, number> = {
  green_sold_out: 0,
  green_on_pace: 1,
  yellow: 2,
  orange: 3,
  red: 4,
};

function tierDropped(prev: string, next: string): boolean {
  return (TIER_RANK[next] ?? 4) > (TIER_RANK[prev] ?? 4);
}

export function detectAlerts(
  original: FlightPlan,
  updated: FlightPlan,
  diff: DiffSummary,
): FlightAlert[] {
  const alerts: FlightAlert[] = [];

  for (let i = 0; i < updated.markets.length; i++) {
    const market = updated.markets[i];
    const prev = original.markets[i];
    if (!market || !prev || market.status === 'played') continue;

    // 1. Tier drops
    if (tierDropped(prev.prediction.tier, market.prediction.tier)) {
      const isCritical = market.prediction.tier === 'red' || market.prediction.tier === 'orange';
      alerts.push({
        type: 'tier_drop',
        severity: isCritical ? 'critical' : 'warning',
        market: market.city,
        showDate: market.showDate,
        daysOut: market.daysOut,
        headline: `${market.city} dropped to ${market.prediction.tierLabel}`,
        detail: `Moved from ${prev.prediction.tierLabel} → ${market.prediction.tierLabel}. Now at ${(market.pctSold * 100).toFixed(0)}% sold with ${market.daysOut} days to go.`,
        previousTier: prev.prediction.tier,
        newTier: market.prediction.tier,
        currentPct: market.pctSold,
        predictedPct: market.prediction.blendedPredPct,
        gap: market.prediction.gap,
      });
    }

    // 2. Velocity stalls
    if (isVelocityStall(market)) {
      alerts.push({
        type: 'velocity_stall',
        severity: market.daysOut <= 14 ? 'critical' : 'warning',
        market: market.city,
        showDate: market.showDate,
        daysOut: market.daysOut,
        headline: `${market.city} velocity has stalled`,
        detail: `Recent weekly velocity is ${market.recentWeeklyVelocity} tickets/week (avg: ${market.avgWeeklyVelocity}). Needs ${market.prediction.requiredWeeklyVelocity.toFixed(0)}/week to close the gap.`,
        currentPct: market.pctSold,
        predictedPct: market.prediction.blendedPredPct,
        gap: market.prediction.gap,
      });
    }

    // 3. Show week urgency
    if (market.daysOut <= 7 && market.prediction.blendedPredPct < 0.9 && market.prediction.tier !== 'green_sold_out') {
      alerts.push({
        type: 'show_week_urgency',
        severity: 'critical',
        market: market.city,
        showDate: market.showDate,
        daysOut: market.daysOut,
        headline: `${market.city} — show in ${market.daysOut} days, not projected to sell out`,
        detail: `Currently ${(market.pctSold * 100).toFixed(0)}% sold, projected ${(market.prediction.blendedPredPct * 100).toFixed(0)}%. Gap of ${market.prediction.gap.toLocaleString()} tickets.`,
        currentPct: market.pctSold,
        predictedPct: market.prediction.blendedPredPct,
        gap: market.prediction.gap,
      });
    }
  }

  // Sort: critical first, then by days out (most urgent first)
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return a.daysOut - b.daysOut;
  });

  return alerts;
}

function isVelocityStall(market: Market): boolean {
  // A velocity stall means recent velocity has dropped to near zero
  // while the market isn't already sold out or close to it
  if (market.pctSold >= 0.92) return false; // nearly sold out, not a concern
  if (market.status === 'sold_out') return false;

  const velocityRatio = market.avgWeeklyVelocity > 0
    ? market.recentWeeklyVelocity / market.avgWeeklyVelocity
    : 0;

  // Stall = recent velocity dropped to less than 25% of average
  // AND there's still a meaningful gap to close
  return velocityRatio < 0.25 && market.prediction.gap > 50;
}

export function buildAlertPayload(
  original: FlightPlan,
  updated: FlightPlan,
  diff: DiffSummary,
  recipients: string[],
  baseUrl: string,
): AlertPayload | null {
  const alerts = detectAlerts(original, updated, diff);
  if (alerts.length === 0) return null;

  return {
    flightSlug: updated.slug,
    artist: updated.artist,
    tourName: updated.tourName,
    legName: updated.legName,
    dashboardUrl: `${baseUrl}/flight/${updated.slug}`,
    alerts,
    summaryStats: {
      marketsUpdated: diff.marketsUpdated,
      totalMarkets: diff.marketsTotal,
      overallSellThrough: updated.summary.avgSellThrough,
      tierCounts: updated.summary.tierCounts,
    },
    recipients,
    timestamp: new Date().toISOString(),
  };
}
