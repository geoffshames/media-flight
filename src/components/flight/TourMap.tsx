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

// Build GeoJSON from market data
function buildGeoJSON(markets: Market[]) {
  const features = markets
    .filter((m) => CITY_COORDS[m.city])
    .map((m) => {
      const coords = CITY_COORDS[m.city];
      const gap = m.prediction.gap;
      // Circle radius in pixels based on gap severity
      const radius = gap > 500 ? 12 : gap > 100 ? 9 : 6;
      const needsAttention = m.prediction.tier === 'red' || m.prediction.tier === 'orange';

      return {
        type: 'Feature' as const,
        properties: {
          city: m.city,
          venue: m.venue,
          tierColor: m.prediction.tierColor,
          tier: m.prediction.tier,
          radius,
          needsAttention,
          pctSold: m.pctSold,
          ticketsSold: m.ticketsSold,
          capacity: m.capacity,
          gap: m.prediction.gap,
          daysOut: m.daysOut,
          budgetAmount: m.prediction.budgets[0]?.amount || 0,
          budgetRate: m.prediction.budgets[0]?.rate || 0,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: coords,
        },
      };
    });

  return { type: 'FeatureCollection' as const, features };
}

export function TourMap({ markets }: TourMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mappedMarkets = markets.filter((m) => CITY_COORDS[m.city]);

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

        const bounds = getBounds();
        if (bounds) {
          map.fitBounds(bounds, { padding: 60, duration: 1500 });
        }

        const geojson = buildGeoJSON(mappedMarkets);

        // --- Tour route line ---
        const sortedByDate = [...mappedMarkets]
          .sort((a, b) => a.showDate.localeCompare(b.showDate));
        const routeCoords = sortedByDate.map((m) => CITY_COORDS[m.city]);

        if (routeCoords.length > 1) {
          map.addSource('tour-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: routeCoords },
            },
          });

          map.addLayer({
            id: 'tour-route-line',
            type: 'line',
            source: 'tour-route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#FD3737',
              'line-width': 1.5,
              'line-opacity': 0.2,
              'line-dasharray': [4, 4],
            },
          });
        }

        // --- Market points source ---
        map.addSource('markets', { type: 'geojson', data: geojson as any });

        // Outer glow circle (larger, faint)
        map.addLayer({
          id: 'market-glow',
          type: 'circle',
          source: 'markets',
          paint: {
            'circle-radius': ['get', 'radius'],
            'circle-radius-transition': { duration: 200 },
            'circle-color': ['get', 'tierColor'],
            'circle-opacity': 0.15,
            'circle-blur': 1,
          },
        });

        // Main circle
        map.addLayer({
          id: 'market-circles',
          type: 'circle',
          source: 'markets',
          paint: {
            'circle-radius': ['get', 'radius'],
            'circle-color': ['get', 'tierColor'],
            'circle-opacity': 0.9,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': 'rgba(255,255,255,0.25)',
          },
        });

        // City labels (native symbol layer — always moves with map)
        map.addLayer({
          id: 'market-labels',
          type: 'symbol',
          source: 'markets',
          layout: {
            'text-field': ['get', 'city'],
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-anchor': 'bottom',
            'text-offset': [0, -1.2],
            'text-allow-overlap': false,
            'text-ignore-placement': false,
          },
          paint: {
            'text-color': '#D4D4D8',
            'text-halo-color': 'rgba(10,10,10,0.9)',
            'text-halo-width': 1.5,
          },
        });

        // Pulse ring layer for at-risk markets (red/orange only)
        // We use a separate source with only at-risk markets
        const atRiskGeoJSON = {
          type: 'FeatureCollection' as const,
          features: geojson.features.filter((f) => f.properties.needsAttention),
        };

        map.addSource('markets-at-risk', { type: 'geojson', data: atRiskGeoJSON as any });

        map.addLayer({
          id: 'market-pulse',
          type: 'circle',
          source: 'markets-at-risk',
          paint: {
            'circle-radius': 18,
            'circle-color': 'transparent',
            'circle-opacity': 0,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': ['get', 'tierColor'],
            'circle-stroke-opacity': 0.4,
          },
        });

        // Animate the pulse ring
        let pulseRadius = 12;
        let pulseOpacity = 0.5;
        let growing = true;
        function animatePulse() {
          if (!mapRef.current) return;
          if (growing) {
            pulseRadius += 0.15;
            pulseOpacity -= 0.005;
            if (pulseRadius >= 24) { growing = false; }
          } else {
            pulseRadius = 12;
            pulseOpacity = 0.5;
            growing = true;
          }
          map.setPaintProperty('market-pulse', 'circle-radius', pulseRadius);
          map.setPaintProperty('market-pulse', 'circle-stroke-opacity', Math.max(pulseOpacity, 0));
          requestAnimationFrame(animatePulse);
        }
        animatePulse();

        // --- Interactivity ---
        map.on('mouseenter', 'market-circles', (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          if (e.features?.[0]) {
            const props = e.features[0].properties;
            const market = mappedMarkets.find((m) => m.city === props.city);
            if (market) setSelectedMarket(market);
          }
        });

        map.on('mouseleave', 'market-circles', () => {
          map.getCanvas().style.cursor = '';
        });

        map.on('click', 'market-circles', (e: any) => {
          if (e.features?.[0]) {
            const props = e.features[0].properties;
            const market = mappedMarkets.find((m) => m.city === props.city);
            if (market) {
              setSelectedMarket((prev) => prev?.city === market.city ? null : market);
            }
          }
        });

        // Click outside a marker to deselect
        map.on('click', (e: any) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['market-circles'] });
          if (features.length === 0) {
            setSelectedMarket(null);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <style jsx global>{`
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
            className="absolute top-4 right-4 w-72 p-5 rounded-xl bg-surface-50/95 backdrop-blur-md border border-surface-200 shadow-xl shadow-black/40 pointer-events-none"
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
