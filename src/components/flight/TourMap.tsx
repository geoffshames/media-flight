'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Market } from '@/lib/types/flight';

interface TourMapProps {
  markets: Market[];
}

// Real lat/lng coordinates for European cities
const CITY_COORDS: Record<string, [number, number]> = {
  Manchester:  [-2.2426, 53.4808],
  Birmingham:  [-1.8904, 52.4862],
  London:      [-0.1276, 51.5074],
  Brussels:    [4.3517, 50.8503],
  Paris:       [2.3522, 48.8566],
  Cologne:     [6.9603, 50.9375],
  Utrecht:     [5.1214, 52.0907],
  Berlin:      [13.4050, 52.5200],
  Munich:      [11.5820, 48.1351],
  Prague:      [14.4378, 50.0755],
  Zurich:      [8.5417, 47.3769],
  Milan:       [9.1900, 45.4642],
  Madrid:      [-3.7038, 40.4168],
  Barcelona:   [2.1734, 41.3851],
  // US cities for benchmark (if ever needed)
  Atlanta:     [-84.3880, 33.7490],
  Boston:      [-71.0589, 42.3601],
  'Washington DC': [-77.0369, 38.9072],
  'New York':  [-74.0060, 40.7128],
  Chicago:     [-87.6298, 41.8781],
  Denver:      [-104.9903, 39.7392],
  'San Francisco': [-122.4194, 37.7749],
  'Los Angeles': [-118.2437, 34.0522],
  Milwaukee:   [-87.9065, 43.0389],
  Austin:      [-97.7431, 30.2672],
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function TourMap({ markets }: TourMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter markets with known coordinates
  const mappedMarkets = markets.filter((m) => CITY_COORDS[m.city]);

  // Compute map bounds from market coordinates
  const getBounds = useCallback(() => {
    const coords = mappedMarkets.map((m) => CITY_COORDS[m.city]);
    if (coords.length === 0) return null;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    return [
      [Math.min(...lngs) - 3, Math.min(...lats) - 2],
      [Math.max(...lngs) + 3, Math.max(...lats) + 2],
    ] as [[number, number], [number, number]];
  }, [mappedMarkets]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    // Dynamically import mapbox-gl to avoid SSR issues
    import('mapbox-gl').then((mapboxgl) => {
      if (cancelled || !mapContainer.current) return;

      // @ts-ignore
      mapboxgl.default.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.default.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [6, 48],
        zoom: 3.5,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        interactive: true,
      });

      map.addControl(new mapboxgl.default.NavigationControl({ showCompass: false }), 'top-left');

      map.on('load', () => {
        if (cancelled) return;
        mapRef.current = map;
        setMapLoaded(true);

        // Fit to market bounds
        const bounds = getBounds();
        if (bounds) {
          map.fitBounds(bounds, { padding: 60, duration: 1500 });
        }

        // Add tour route line
        const routeCoords = mappedMarkets
          .sort((a, b) => a.showDate.localeCompare(b.showDate))
          .map((m) => CITY_COORDS[m.city]);

        if (routeCoords.length > 1) {
          map.addSource('tour-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoords,
              },
            },
          });

          map.addLayer({
            id: 'tour-route-line',
            type: 'line',
            source: 'tour-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#FD3737',
              'line-width': 1.5,
              'line-opacity': 0.25,
              'line-dasharray': [4, 4],
            },
          });
        }

        // Add custom markers for each market
        mappedMarkets.forEach((market) => {
          const coords = CITY_COORDS[market.city];
          if (!coords) return;

          const color = market.prediction.tierColor;
          const gap = market.prediction.gap;
          const isRed = market.prediction.tier === 'red';
          const isOrange = market.prediction.tier === 'orange';
          const needsAttention = isRed || isOrange;

          // Pin size based on gap
          const size = gap > 500 ? 28 : gap > 100 ? 22 : 16;

          // Create custom marker element
          const el = document.createElement('div');
          el.className = 'tour-marker';
          el.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${color};
            border: 2px solid rgba(255,255,255,0.2);
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 0 ${needsAttention ? '12' : '6'}px ${color}88;
            position: relative;
          `;

          // Pulse ring for at-risk markets
          if (needsAttention) {
            const pulse = document.createElement('div');
            pulse.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: ${size + 12}px;
              height: ${size + 12}px;
              border-radius: 50%;
              border: 1.5px solid ${color};
              animation: pulse-ring 2s ease-out infinite;
              pointer-events: none;
            `;
            el.appendChild(pulse);
          }

          // City label
          const label = document.createElement('div');
          label.style.cssText = `
            position: absolute;
            top: -24px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            font-family: 'Work Sans', sans-serif;
            font-size: 11px;
            font-weight: 500;
            color: #D4D4D8;
            text-shadow: 0 1px 4px rgba(0,0,0,0.8);
            pointer-events: none;
          `;
          label.textContent = market.city;
          el.appendChild(label);

          // Hover effects
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.3)';
            el.style.zIndex = '10';
            el.style.borderColor = 'rgba(255,255,255,0.6)';
            label.style.color = '#FAFAFA';
            label.style.fontWeight = '600';
            setSelectedMarket(market);
          });
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.zIndex = '1';
            el.style.borderColor = 'rgba(255,255,255,0.2)';
            label.style.color = '#D4D4D8';
            label.style.fontWeight = '500';
          });
          el.addEventListener('click', () => {
            setSelectedMarket((prev) => prev?.city === market.city ? null : market);
          });

          const marker = new mapboxgl.default.Marker({ element: el, anchor: 'center' })
            .setLngLat(coords)
            .addTo(map);

          markersRef.current.push(marker);
        });
      });
    });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Inject pulse animation */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
        }
        .mapboxgl-ctrl-group {
          background: #1A1A1A !important;
          border: 1px solid #333 !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button {
          background: #1A1A1A !important;
          border-color: #333 !important;
        }
        .mapboxgl-ctrl-group button:hover {
          background: #2A2A2A !important;
        }
        .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon {
          filter: invert(1);
        }
      `}</style>

      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full rounded-2xl overflow-hidden border border-surface-200"
        style={{ height: '560px' }}
      />

      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-50 rounded-2xl">
          <p className="text-text-muted font-body text-sm animate-pulse">Loading map...</p>
        </div>
      )}

      {/* Info card */}
      <AnimatePresence>
        {selectedMarket && (
          <motion.div
            key={selectedMarket.city}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 w-72 p-5 rounded-xl bg-surface-50/95 backdrop-blur-md border border-surface-200 shadow-xl shadow-black/40"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-heading text-lg font-bold text-text-primary">
                  {selectedMarket.city}
                </p>
                <p className="font-body text-xs text-text-muted">
                  {selectedMarket.venue}
                </p>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                style={{
                  color: selectedMarket.prediction.tierColor,
                  border: `1px solid ${selectedMarket.prediction.tierColor}44`,
                  backgroundColor: `${selectedMarket.prediction.tierColor}11`,
                }}
              >
                {selectedMarket.prediction.tier.replace('green_', '').replace('_', ' ')}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs font-body text-text-muted mb-1">
                <span>{selectedMarket.ticketsSold.toLocaleString()} sold</span>
                <span>{selectedMarket.capacity.toLocaleString()} cap</span>
              </div>
              <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(selectedMarket.pctSold * 100, 100)}%`,
                    backgroundColor: selectedMarket.prediction.tierColor,
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-text-muted font-body uppercase tracking-wider">Sold</p>
                <p className="text-sm font-bold text-text-primary font-heading">
                  {Math.round(selectedMarket.pctSold * 100)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-body uppercase tracking-wider">Gap</p>
                <p className="text-sm font-bold text-text-primary font-heading">
                  {selectedMarket.prediction.gap.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-body uppercase tracking-wider">Days Out</p>
                <p className="text-sm font-bold text-text-primary font-heading">
                  {selectedMarket.daysOut}
                </p>
              </div>
            </div>

            {selectedMarket.prediction.gap > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-200">
                <p className="text-[10px] text-text-muted font-body uppercase tracking-wider mb-1">Budget Needed</p>
                <p className="text-base font-bold font-heading" style={{ color: selectedMarket.prediction.tierColor }}>
                  ${selectedMarket.prediction.budgets[0]?.amount.toLocaleString()}
                  <span className="text-xs text-text-muted font-normal ml-1">
                    @ ${selectedMarket.prediction.budgets[0]?.rate}/ticket
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
