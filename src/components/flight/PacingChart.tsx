'use client';
import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { Market, BenchmarkData } from '@/lib/types/flight';


interface PacingChartProps {
  markets: Market[];
  benchmark?: BenchmarkData;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

export function PacingChart({ markets, benchmark }: PacingChartProps) {
  
  const [visibleMarkets, setVisibleMarkets] = useState<Set<string>>(
    new Set(
      markets
        .filter((m) => m.prediction.tier !== 'green_sold_out' && m.prediction.tier !== 'green_on_pace')
        .map((m) => `${m.city}-${m.showDate}`)
    )
  );

  // Combine all pacing history into a timeline
  const chartData: any[] = [];
  const dateMap = new Map<string, any>();

  markets.forEach((market) => {
    market.pacingHistory.forEach((snapshot) => {
      const key = snapshot.date;
      if (!dateMap.has(key)) {
        dateMap.set(key, { date: key, daysOut: snapshot.daysOut });
      }
      const entry = dateMap.get(key)!;
      const marketKey = `${market.city}-${market.showDate}`;
      if (visibleMarkets.has(marketKey)) {
        entry[marketKey] = snapshot.pctSold * 100;
      }
    });
  });

  // Sort by date and add to chartData
  Array.from(dateMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .forEach(([_, data]) => {
      chartData.push(data);
    });

  const tierColors: Record<string, string> = {
    red: '#FF1744',
    orange: '#FF9100',
    yellow: '#FFD600',
    green_on_pace: '#00E676',
  };

  const getColorForMarket = (city: string) => {
    const market = markets.find((m) => m.city === city);
    if (!market) return '#B8B8C0';
    return tierColors[market.prediction.tier] || '#B8B8C0';
  };

  const toggleMarket = (marketId: string) => {
    const newVisible = new Set(visibleMarkets);
    if (newVisible.has(marketId)) {
      newVisible.delete(marketId);
    } else {
      newVisible.add(marketId);
    }
    setVisibleMarkets(newVisible);
  };

  return (
    <motion.div
      
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="space-y-6"
    >
      {/* Market toggles */}
      <div className="flex flex-wrap gap-2">
        {markets
          .filter((m) => m.prediction.tier !== 'green_sold_out' && m.prediction.tier !== 'green_on_pace')
          .map((market) => {
            const marketId = `${market.city}-${market.showDate}`;
            const isVisible = visibleMarkets.has(marketId);
            return (
              <button
                key={marketId}
                onClick={() => toggleMarket(marketId)}
                className={`px-3 py-1 rounded text-xs font-body transition-colors ${
                  isVisible
                    ? 'bg-accent/20 border border-accent text-text-primary'
                    : 'bg-surface-100 border border-surface-200 text-text-muted hover:bg-surface-200'
                }`}
              >
                {market.city}
              </button>
            );
          })}
      </div>

      {/* Chart */}
      <div className="w-full h-80 bg-surface-50/40 border border-surface-200 rounded-lg p-4 backdrop-blur-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis
              dataKey="date"
              stroke="#B8B8C0"
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => {
                const d = new Date(date + 'T00:00:00');
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis stroke="#B8B8C0" tick={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #333333',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#FAFAFA' }}
              formatter={(value) => [(value as number).toFixed(1) + '%', '']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '16px' }}
              iconType="line"
              formatter={(_, { dataKey }) => {
                const parts = (dataKey as string).split('-');
                return parts[0];
              }}
            />
            <ReferenceLine y={100} stroke="#999999" strokeDasharray="5 5" label="100%" />

            {markets
              .filter((m) => visibleMarkets.has(`${m.city}-${m.showDate}`))
              .map((market) => (
                <Line
                  key={`${market.city}-${market.showDate}`}
                  dataKey={`${market.city}-${market.showDate}`}
                  stroke={getColorForMarket(market.city)}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              ))}

            {benchmark && (
              <Line
                dataKey="benchmarkMedian"
                stroke="#666666"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
                name="Benchmark"
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
