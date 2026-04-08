export interface FlightPlan {
  slug: string;
  artist: string;
  tourName: string;
  legName: string;
  dateRange: string;
  generatedDate: string;
  accentColor?: string;
  password?: string;                 // Simple access password for this flight plan
  summary: FlightSummary;
  cptRates: number[];
  markets: Market[];
  benchmark?: BenchmarkData;
  methodology: MethodologyInfo;
  images: { hero: string; closing: string };
}

export interface FlightSummary {
  totalMarkets: number;
  totalCapacity: number;
  totalSold: number;
  avgSellThrough: number;
  totalPredictedGap: number;
  budgetRecommendations: { rate: number; totalBudget: number }[];
  tierCounts: { green: number; yellow: number; orange: number; red: number };
}

export interface Market {
  showDate: string;
  city: string;
  country: string;
  venue: string;
  capacity: number;
  ticketsSold: number;
  pctSold: number;
  daysOut: number;
  status: 'played' | 'on_sale' | 'sold_out';
  avgWeeklyVelocity: number;
  recentWeeklyVelocity: number;
  velocityTrend: 'accelerating' | 'steady' | 'decelerating';
  prediction: MarketPrediction;
  pacingHistory: PacingSnapshot[];
  pacingNote: string;
}

export interface MarketPrediction {
  velocityPredPct: number;
  multiplierPredPct?: number;
  blendedPredPct: number;
  predictedSold: number;
  gap: number;
  confidence: 'high' | 'medium' | 'low';
  budgets: { rate: number; amount: number }[];
  requiredWeeklyVelocity: number;
  velocityGap: number;
  weeksRemaining: number;
  tier: 'green_sold_out' | 'green_on_pace' | 'yellow' | 'orange' | 'red';
  tierLabel: string;
  tierColor: string;
}

export interface PacingSnapshot {
  date: string;
  ticketsSold: number;
  pctSold: number;
  daysOut: number;
}

export interface BenchmarkData {
  legName: string;
  totalShows: number;
  avgSellThrough: number;
  soldOutCount: number;
  soldOutPct: number;
  pacingBenchmarks: {
    milestone: string;
    daysOut: number;
    allShowsMedian: number;
    allShowsMean: number;
    soldOutMedian?: number;
    notSoldOutMedian?: number;
  }[];
  multipliers: { daysOut: number; medianMultiplier: number; sampleSize: number }[];
  shows: BenchmarkShow[];
}

export interface BenchmarkShow {
  city: string;
  venue: string;
  capacity: number;
  finalPctSold: number;
  soldOut: boolean;
  pacingAtMilestones: { milestone: string; pctSold: number }[];
}

export interface MethodologyInfo {
  description: string;
  velocityWeight: number;
  multiplierWeight: number;
  surgeMultiplier: number;
  benchmarkAvailable: boolean;
  snapshotCount: number;
  dateOfAnalysis: string;
}

// ── Prediction Snapshots ──

export interface PredictionSnapshot {
  id: string;
  flightSlug: string;
  timestamp: string;
  source: 'skill_run' | 'upload_widget';
  sourceFile?: string;
  markets: MarketSnapshot[];
  modelParams: {
    velocityWeight: number;
    multiplierWeight: number;
    surgeMultiplier: number;
    calibrationApplied: boolean;
  };
}

export interface MarketSnapshot {
  city: string;
  showDate: string;
  daysOut: number;
  ticketsSold: number;
  pctSold: number;
  predictedFinalPct: number;
  predictedFinalSold: number;
  tier: string;
  confidence: 'high' | 'medium' | 'low';
}

// ── Upload Widget Types ──

export interface DiffSummary {
  filename: string;
  timestamp: string;
  marketsUpdated: number;
  marketsTotal: number;
  biggestMovers: {
    city: string;
    previousPct: number;
    newPct: number;
    deltaPct: number;
  }[];
  tierChanges: {
    city: string;
    previousTier: string;
    newTier: string;
  }[];
  budgetChange: {
    rate: number;
    previousTotal: number;
    newTotal: number;
    delta: number;
  }[];
  overallSellThroughChange: number;
}

export interface ParsedMarketUpdate {
  city: string;
  showDate?: string;
  ticketsSold: number;
  capacity?: number;
}

// ── Accuracy Tracking ──

export interface AccuracyRecord {
  id: string;
  flightSlug: string;
  artist: string;
  tourName: string;
  legName: string;
  checkDate: string;
  snapshotDate: string;
  source: 'weekly_wrap' | 'post_show' | 'skill_rerun';
  marketsChecked: number;
  metrics: AccuracyMetrics;
  marketDetails: MarketAccuracyDetail[];
  calibrationApplied: boolean;
}

export interface AccuracyMetrics {
  mape: number;
  bias: number;
  tierAccuracy: number;
  directionAccuracy: number;
}

export interface MarketAccuracyDetail {
  city: string;
  showDate: string;
  daysOutAtPrediction: number;
  predictedPct: number;
  actualPct: number;
  error: number;
  tierPredicted: string;
  tierActual: string;
  tierCorrect: boolean;
}

// ── Calibration ──

export interface CalibrationData {
  lastUpdated: string;
  sampleSize: number;
  biasCorrections: {
    below50pct: number;
    '50to75pct': number;
    above75pct: number;
  };
  weights: {
    velocityWeight: number;
    multiplierWeight: number;
  };
  surgeMultiplier: number;
  notes: string;
  history: CalibrationChange[];
}

export interface CalibrationChange {
  date: string;
  trigger: string;
  mapeBeforeCalibration: number;
  mapeAfterCalibration: number;
  changes: string;
}
