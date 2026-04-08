'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlightData } from '@/lib/context/FlightDataContext';

type DownloadMode = 'summary' | 'full';

export function DownloadButton() {
  const { data } = useFlightData();
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<DownloadMode | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleDownload = useCallback(async (selectedMode: DownloadMode) => {
    setMode(selectedMode);
    setGenerating(true);
    try {
      // Dynamic import to keep bundle light
      const { generateFlightPDF } = await import('@/lib/pdf/generate-pdf');
      generateFlightPDF(data, selectedMode);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setGenerating(false);
      setMode(null);
      setIsOpen(false);
    }
  }, [data]);

  const onSaleCount = data.markets.filter(m => m.status !== 'played').length;

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-100 border border-surface-200 text-text-secondary text-sm font-body hover:bg-surface-200 hover:text-text-primary transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export PDF
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-[260px] rounded-xl bg-[#181818]/95 backdrop-blur-xl border border-[#303030] shadow-2xl shadow-black/50 z-50 overflow-hidden"
          >
            <div className="p-3 space-y-1">
              {/* Summary option */}
              <button
                onClick={() => handleDownload('summary')}
                disabled={generating}
                className="w-full text-left p-3 rounded-lg hover:bg-surface-200 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-primary text-sm font-medium">Summary</span>
                  {generating && mode === 'summary' ? (
                    <div className="w-3.5 h-3.5 border border-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-text-muted text-xs">1 page</span>
                  )}
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  Tour health, tier breakdown, budgets, market table
                </p>
              </button>

              {/* Full report option */}
              <button
                onClick={() => handleDownload('full')}
                disabled={generating}
                className="w-full text-left p-3 rounded-lg hover:bg-surface-200 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-primary text-sm font-medium">Full Report</span>
                  {generating && mode === 'full' ? (
                    <div className="w-3.5 h-3.5 border border-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-text-muted text-xs">{onSaleCount + 1} pages</span>
                  )}
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  Summary + per-market detail with velocity and budgets
                </p>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
