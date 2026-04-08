export interface FlightPlan {
  slug: string;
  artist: string;
  tourName: string;
  legName: string;
  dateRange: string;
  generatedDate: string;
  accentColor?: string;
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
