import type { AccuracyRecord } from '@/lib/types/flight';

/**
 * Accuracy records accumulate here as the skill is re-run with fresh data.
 * Each record represents a comparison between predictions and actual outcomes.
 */
export const accuracyLog: AccuracyRecord[] = [
  // Records will be appended by the skill on each re-run with updated data.
  // Example record structure:
  // {
  //   id: 'abc-123',
  //   flightSlug: 'miguel-caos-uk-eu',
  //   artist: 'Miguel',
  //   tourName: 'CAOS Tour',
  //   legName: 'UK & Europe',
  //   checkDate: '2026-04-15',
  //   snapshotDate: '2026-04-08',
  //   source: 'weekly_wrap',
  //   marketsChecked: 12,
  //   metrics: { mape: 0.08, bias: 0.03, tierAccuracy: 0.83, directionAccuracy: 0.92 },
  //   marketDetails: [...],
  //   calibrationApplied: false,
  // }
];
