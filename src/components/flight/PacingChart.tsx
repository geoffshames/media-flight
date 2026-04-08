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
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

// Muted line palette — no bright tier colors
const LINE_COLORS = [
  '#FAFAFA',   // white
  '#A1A1AA',   // gray
  '#FD3737',   // accent red
  '#FF8A80',   // soft coral
  '#FFAB91',   // peach
  '#CE93D8',   // lavender
];

/** Custom tooltip with city names */
function CustomTooltip({ active, payload, label, cityMap }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const dateStr = (() => {
    try {
      const d = new Date(label + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return label;
    }
  })();

  return (
    <div className="bg-surface-100 border border-surface-200 rounded-lg p-3 shadow-xl">
      <p className="text-[12px] text-text-muted mb-2 font-body">{dateStr}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, idx: number) => {
          const cityName = cityMap[entry.dataKey] || entry.dataKey;
          return (
            <div key={idx} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[13px] text-text-secondary font-body">{cityName}</span>
              </div>
              <span className="text-[13px] font-medium text-text-primary font-body">
                {(entry.value as number).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PacingChart({ markets, benchmark }: PacingChartProps) {

  // Default: show non-green markets
  const riskMarkets = markets.filter(
    (m) => m.prediction.tier !== 'green_sold_out' && m.prediction.tier !== 'green_on_pace'
  );

  const [visibleMarkets, setVisibleMarkets] = useState<Set<string>>(
    new Set(riskMarkets.map((m) => `${m.city}-${m.showDate}`))
  );

  // Build city name lookup from dataKey
  const cityMap: Record<string, string> = {};
  markets.forEach((m) => {
    cityMap[`${m.city}-${m.showDate}`] = m.city;
  });

  // Assign colors per visible market
  const colorMap: Record<string, string> = {};
  let colorIdx = 0;
  riskMarkets.forEach((m) => {
    const key = `${m.city}-${m.showDate}`;
    colorMap[key] = LINE_COLORS[colorIdx % LINE_COLORS.length];
    colorIdx++;
  });

  // Combine all pacing history into a timeline
  const dateMap = new Map<string, any>();

  markets.forEach((market) => {
    market.pacingHistory.forEach((snapshot) => {
      const key = snapshot.date;
      if (!dateMap.has(key)) {
        dateMap.set(key, { date: key });
      }
      const entry = dateMap.get(key)!;
      const marketKey = `${market.city}-${market.showDate}`;
      if (visibleMarkets.has(marketKey)) {
        entry[marketKey] = snapshot.pctSold * 100;
      }
    });
  });

  // Sort by date
  const chartData = Array.from(dateMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([_, data]) => data);

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
      className="space-y-5"
    >
      {/* Market toggles */}
      <div className="flex flex-wrap gap-2">
        {riskMarkets.map((market) => {
          const marketId = `${market.city}-${market.showDate}`;
          const isVisible = visibleMarkets.has(marketId);
          const color = colorMap[marketId];
          return (
            <button
              key={marketId}
              onClick={() => toggleMarket(marketId)}
              className={`px-3 py-1.5 rounded text-[13px] font-body tracking-wide transition-all ${
                isVisible
                  ? 'text-text-primary border'
                  : 'bg-surface-100 border border-surface-200 text-text-muted hover:text-text-secondary'
              }`}
              style={isVisible ? { borderColor: color, backgroundColor: `${color}10` } : undefined}
            >
              {market.city}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="w-full h-80 border border-surface-200 rounded-xl p-4 bg-surface-50/40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
            <XAxis
              dataKey="date"
              stroke="#71717A"
              tick={{ fontSize: 12, fill: '#71717A' }}
              tickFormatter={(date) => {
                const d = new Date(date + 'T00:00:00');
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis
              stroke="#71717A"
              tick={{ fontSize: 12, fill: '#71717A' }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={<CustomTooltip cityMap={cityMap} />}
              cursor={{ stroke: '#333333', strokeWidth: 1 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '12px' }}
              iconType="line"
              iconSize={10}
              formatter={(_, { dataKey }) => {
                return (cityMap[dataKey as string] || String(dataKey)) as string;
              }}
            />
            <ReferenceLine
              y={100}
              stroke="#333333"
              strokeDasharray="5 5"
              label={{ value: '100%', fill: '#71717A', fontSize: 11, position: 'right' }}
            />

            {markets
              .filter((m) => visibleMarkets.has(`${m.city}-${m.showDate}`))
              .map((market) => {
                const key = `${market.city}-${market.showDate}`;
                return (
                  <Line
                    key={key}
                    dataKey={key}
                    stroke={colorMap[key] || '#A1A1AA'}
                    dot={false}
                    strokeWidth={2}
                    isAnimationActive={true}
                    name={key}
                  />
                );
              })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
