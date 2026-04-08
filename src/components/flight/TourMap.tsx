'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Market } from '@/lib/types/flight';

interface TourMapProps {
  markets: Market[];
}

// Mercator-projected coordinates for European cities
// Mapped to a 1000x800 SVG viewBox covering roughly -12°W to 25°E, 36°N to 58°N
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  Manchester:  { x: 395, y: 215 },
  Birmingham:  { x: 400, y: 240 },
  London:      { x: 415, y: 265 },
  Brussels:    { x: 460, y: 265 },
  Paris:       { x: 440, y: 310 },
  Cologne:     { x: 500, y: 255 },
  Utrecht:     { x: 475, y: 235 },
  Berlin:      { x: 560, y: 220 },
  Munich:      { x: 545, y: 310 },
  Prague:      { x: 570, y: 275 },
  Zurich:      { x: 500, y: 340 },
  Milan:       { x: 510, y: 370 },
  Madrid:      { x: 320, y: 490 },
  Barcelona:   { x: 400, y: 460 },
};

// Simplified European outline paths for visual context
const EUROPE_PATHS = [
  // British Isles
  'M360,140 L380,120 L410,110 L430,130 L440,170 L435,200 L425,230 L440,260 L430,280 L410,285 L395,270 L380,280 L360,260 L355,230 L365,200 L350,170 Z',
  // Ireland
  'M310,160 L330,145 L350,155 L355,180 L345,210 L325,215 L310,195 L305,175 Z',
  // France
  'M390,290 L430,270 L470,265 L500,280 L520,310 L510,340 L490,370 L460,380 L420,400 L380,385 L360,370 L340,390 L330,370 L340,340 L350,310 L370,300 Z',
  // Iberian Peninsula
  'M280,400 L320,380 L350,370 L380,385 L420,400 L430,420 L420,460 L400,490 L370,510 L340,520 L300,520 L270,500 L260,470 L265,440 L275,420 Z',
  // Germany / Central Europe
  'M470,200 L510,185 L560,190 L600,200 L610,230 L600,260 L580,280 L550,290 L520,310 L500,280 L470,265 L460,240 Z',
  // Italy
  'M490,370 L510,340 L540,330 L560,350 L555,380 L540,410 L525,440 L510,460 L500,450 L505,420 L500,400 Z',
  // Italy boot toe + Sicily
  'M525,440 L540,460 L555,470 L545,480 L530,475 L520,460 Z',
  // Scandinavia hint
  'M470,80 L490,60 L520,50 L550,70 L560,100 L570,140 L560,180 L540,190 L520,185 L510,160 L500,130 L490,110 L475,100 Z',
  // Poland / Eastern
  'M560,190 L600,180 L640,190 L660,220 L650,260 L620,280 L600,260 L580,280 L560,260 L570,230 Z',
  // Czech / Austria / Switzerland
  'M500,280 L540,270 L580,280 L570,310 L540,330 L510,340 L500,320 Z',
];

const tierOrder: Record<string, number> = {
  red: 0, orange: 1, yellow: 2, green_on_pace: 3, green_sold_out: 4,
};

export function TourMap({ markets }: TourMapProps) {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const mappedMarkets = useMemo(() => {
    return markets
      .filter((m) => CITY_COORDS[m.city])
      .map((m) => ({
        ...m,
        coords: CITY_COORDS[m.city],
      }))
      .sort((a, b) => (tierOrder[a.prediction.tier] ?? 5) - (tierOrder[b.prediction.tier] ?? 5));
  }, [markets]);

  const activeCity = selectedCity || hoveredCity;
  const activeMarket = activeCity ? mappedMarkets.find((m) => m.city === activeCity) : null;

  return (
    <div className="relative w-full">
      {/* Map container */}
      <div className="relative w-full aspect-[5/4] max-h-[600px]">
        <svg
          viewBox="220 40 500 520"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Europe outline */}
          <g opacity="0.15">
            {EUROPE_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="#D4D4D8"
                stroke="#333333"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* Tour route lines connecting markets by date */}
          <g>
            {mappedMarkets.slice(0, -1).map((m, i) => {
              const next = mappedMarkets[i + 1];
              if (!next) return null;
              return (
                <line
                  key={`route-${i}`}
                  x1={m.coords.x}
                  y1={m.coords.y}
                  x2={next.coords.x}
                  y2={next.coords.y}
                  stroke="#FD3737"
                  strokeWidth="1"
                  strokeOpacity="0.15"
                  strokeDasharray="4 4"
                />
              );
            })}
          </g>

          {/* City markers — render green first so red/orange are on top */}
          {[...mappedMarkets].reverse().map((m) => {
            const isActive = m.city === activeCity;
            const color = m.prediction.tierColor;
            const gap = m.prediction.gap;
            // Pin size based on gap — bigger gap = bigger pin
            const baseR = gap > 500 ? 14 : gap > 100 ? 11 : 8;
            const r = isActive ? baseR + 3 : baseR;

            return (
              <g
                key={m.city}
                onMouseEnter={() => setHoveredCity(m.city)}
                onMouseLeave={() => setHoveredCity(null)}
                onClick={() => setSelectedCity(selectedCity === m.city ? null : m.city)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer pulse ring for at-risk markets */}
                {(m.prediction.tier === 'red' || m.prediction.tier === 'orange') && (
                  <circle
                    cx={m.coords.x}
                    cy={m.coords.y}
                    r={baseR + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    opacity="0.3"
                  >
                    <animate
                      attributeName="r"
                      from={String(baseR + 2)}
                      to={String(baseR + 12)}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.4"
                      to="0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Glow */}
                <circle
                  cx={m.coords.x}
                  cy={m.coords.y}
                  r={r + 4}
                  fill={color}
                  opacity={isActive ? 0.25 : 0.1}
                />

                {/* Main dot */}
                <circle
                  cx={m.coords.x}
                  cy={m.coords.y}
                  r={r}
                  fill={color}
                  opacity={isActive ? 1 : 0.85}
                  stroke={isActive ? '#FAFAFA' : 'none'}
                  strokeWidth={isActive ? 2 : 0}
                />

                {/* City label */}
                <text
                  x={m.coords.x}
                  y={m.coords.y - r - 6}
                  textAnchor="middle"
                  fill={isActive ? '#FAFAFA' : '#D4D4D8'}
                  fontSize={isActive ? '13' : '11'}
                  fontWeight={isActive ? '600' : '400'}
                  fontFamily="Work Sans, sans-serif"
                  style={{ transition: 'all 0.2s' }}
                >
                  {m.city}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip / info card */}
        <AnimatePresence>
          {activeMarket && (
            <motion.div
              key={activeMarket.city}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 right-4 w-64 p-4 rounded-xl bg-surface-50/95 backdrop-blur-md border border-surface-200 shadow-xl shadow-black/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-heading text-lg font-bold text-text-primary">
                    {activeMarket.city}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    {activeMarket.venue}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    color: activeMarket.prediction.tierColor,
                    borderColor: `${activeMarket.prediction.tierColor}44`,
                    backgroundColor: `${activeMarket.prediction.tierColor}11`,
                    border: '1px solid',
                  }}
                >
                  {activeMarket.prediction.tier.replace('green_', '').replace('_', ' ')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs font-body text-text-muted mb-1">
                  <span>{activeMarket.ticketsSold.toLocaleString()} sold</span>
                  <span>{activeMarket.capacity.toLocaleString()} cap</span>
                </div>
                <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(activeMarket.pctSold * 100, 100)}%`,
                      backgroundColor: activeMarket.prediction.tierColor,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-text-muted font-body uppercase tracking-wider">Sold</p>
                  <p className="text-sm font-bold text-text-primary font-heading">
                    {Math.round(activeMarket.pctSold * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-body uppercase tracking-wider">Gap</p>
                  <p className="text-sm font-bold text-text-primary font-heading">
                    {activeMarket.prediction.gap.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-body uppercase tracking-wider">Days Out</p>
                  <p className="text-sm font-bold text-text-primary font-heading">
                    {activeMarket.daysOut}
                  </p>
                </div>
              </div>

              {activeMarket.prediction.gap > 0 && (
                <div className="mt-3 pt-3 border-t border-surface-200">
                  <p className="text-[10px] text-text-muted font-body uppercase tracking-wider mb-1">Budget Needed</p>
                  <p className="text-base font-bold font-heading" style={{ color: activeMarket.prediction.tierColor }}>
                    ${activeMarket.prediction.budgets[0]?.amount.toLocaleString()}
                    <span className="text-xs text-text-muted font-normal ml-1">
                      @ ${activeMarket.prediction.budgets[0]?.rate}/ticket
                    </span>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 font-body text-xs text-text-muted">
        {[
          { color: '#FF1744', label: 'Critical' },
          { color: '#FF9100', label: 'At Risk' },
          { color: '#FFD600', label: 'Needs Push' },
          { color: '#00E676', label: 'On Pace / Sold Out' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
        <span className="text-surface-300 mx-1">|</span>
        <span>Pin size = gap to sellout</span>
      </div>
    </div>
  );
}
