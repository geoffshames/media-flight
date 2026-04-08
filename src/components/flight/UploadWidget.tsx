'use client';
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlightData } from '@/lib/context/FlightDataContext';
import { recalculateFromUpload } from '@/lib/engine/recalculate';
import { formatPct, formatCurrency } from '@/lib/utils/formatters';
import { tierAccentColor } from '@/lib/utils/formatters';

type ProcessingState = 'idle' | 'parsing' | 'matching' | 'predicting' | 'done' | 'error';

export function UploadWidget() {
  const { originalData, isUpdated, diffSummary, applyUpdate, revert, saveSnapshot } = useFlightData();
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState>('idle');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSnapshot = useRef<ReturnType<typeof recalculateFromUpload>['snapshot'] | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setProcessing('parsing');
    setWarnings([]);
    setSnapshotSaved(false);

    try {
      const buffer = await file.arrayBuffer();

      setProcessing('matching');
      await new Promise(r => setTimeout(r, 200)); // visual beat

      setProcessing('predicting');
      await new Promise(r => setTimeout(r, 200));

      const result = recalculateFromUpload(originalData, buffer, file.name);

      if (result.parseWarnings.length > 0) {
        setWarnings(result.parseWarnings);
      }

      if (result.diff.marketsUpdated === 0) {
        setWarnings(prev => [...prev, 'No market data could be matched. Try a different file or use manual entry.']);
        setProcessing('error');
        return;
      }

      pendingSnapshot.current = result.snapshot;
      applyUpdate(result.updatedPlan, result.diff);
      setProcessing('done');
    } catch (err) {
      console.error('Parse error:', err);
      setWarnings(['Failed to parse file. Please check the format and try again.']);
      setProcessing('error');
    }
  }, [originalData, applyUpdate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSaveSnapshot = useCallback(() => {
    if (pendingSnapshot.current) {
      saveSnapshot(pendingSnapshot.current);
      setSnapshotSaved(true);
    }
  }, [saveSnapshot]);

  const handleRevert = useCallback(() => {
    revert();
    setProcessing('idle');
    setWarnings([]);
    setSnapshotSaved(false);
    pendingSnapshot.current = null;
  }, [revert]);

  return (
    <>
      {/* Update banner */}
      <AnimatePresence>
        {isUpdated && diffSummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 36, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-[65px] left-0 right-0 z-40 bg-accent/10 border-b border-accent/20 flex items-center justify-center gap-3 text-xs font-body"
          >
            <span className="text-text-secondary">
              Updated from <span className="text-text-primary font-medium">{diffSummary.filename}</span>
              {' · '}
              {diffSummary.marketsUpdated} of {diffSummary.marketsTotal} markets
            </span>
            <button
              onClick={handleRevert}
              className="text-accent hover:text-accent-light transition-colors font-medium"
            >
              Revert
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg shadow-accent/30 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? {} : { scale: [1, 1.05, 1] }}
        transition={isOpen ? {} : { repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          ) : (
            <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>
          )}
        </svg>
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[80vh] overflow-y-auto rounded-2xl bg-[#181818]/95 backdrop-blur-xl border border-[#303030] shadow-2xl shadow-black/50"
          >
            <div className="p-5">
              <h3 className="font-heading text-sm tracking-[0.2em] text-text-primary uppercase mb-4">
                Update Ticket Data
              </h3>

              {/* Drop zone */}
              {processing === 'idle' || processing === 'error' ? (
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#404040] rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-accent/40 hover:bg-accent/5"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <svg className="mx-auto mb-3 text-text-muted" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <p className="text-text-secondary text-sm">Drop spreadsheet here</p>
                  <p className="text-text-muted text-xs mt-1">.xlsx, .xls, or .csv</p>
                </div>
              ) : null}

              {/* Processing states */}
              {(processing === 'parsing' || processing === 'matching' || processing === 'predicting') && (
                <div className="py-8 text-center">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary text-sm">
                    {processing === 'parsing' && 'Parsing spreadsheet...'}
                    {processing === 'matching' && 'Matching markets...'}
                    {processing === 'predicting' && 'Running predictions...'}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-yellow-400/80 text-xs">{w}</p>
                  ))}
                </div>
              )}

              {/* Diff summary */}
              {processing === 'done' && diffSummary && (
                <div className="space-y-4">
                  {/* Markets updated */}
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted text-xs">Markets updated</span>
                    <span className="text-text-primary text-sm font-medium">
                      {diffSummary.marketsUpdated} of {diffSummary.marketsTotal}
                    </span>
                  </div>

                  {/* Biggest movers */}
                  {diffSummary.biggestMovers.length > 0 && (
                    <div>
                      <p className="text-text-muted text-xs mb-2">Biggest movers</p>
                      {diffSummary.biggestMovers.map(m => (
                        <div key={m.city} className="flex items-center justify-between py-1">
                          <span className="text-text-secondary text-sm">{m.city}</span>
                          <span className={`text-sm font-mono ${m.deltaPct > 0 ? 'text-tier-green' : 'text-tier-red'}`}>
                            {m.deltaPct > 0 ? '+' : ''}{formatPct(m.deltaPct)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tier changes */}
                  {diffSummary.tierChanges.length > 0 && (
                    <div>
                      <p className="text-text-muted text-xs mb-2">Tier changes</p>
                      {diffSummary.tierChanges.map(tc => (
                        <div key={tc.city} className="flex items-center gap-2 py-1">
                          <span className="text-text-secondary text-sm">{tc.city}</span>
                          <span className="text-text-muted text-xs">→</span>
                          <span className="text-text-primary text-xs font-medium">{tc.newTier}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Budget change */}
                  {diffSummary.budgetChange.map(bc => (
                    <div key={bc.rate} className="flex items-center justify-between">
                      <span className="text-text-muted text-xs">Budget @ ${bc.rate}/ticket</span>
                      <span className="text-text-primary text-sm">
                        {formatCurrency(bc.previousTotal)} → {formatCurrency(bc.newTotal)}
                        <span className={`ml-2 text-xs ${bc.delta < 0 ? 'text-tier-green' : 'text-tier-red'}`}>
                          ({bc.delta > 0 ? '+' : ''}{formatCurrency(bc.delta)})
                        </span>
                      </span>
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-surface-200">
                    <button
                      onClick={handleSaveSnapshot}
                      disabled={snapshotSaved}
                      className="flex-1 py-2 px-3 rounded-lg bg-surface-200 text-text-secondary text-xs font-medium hover:bg-surface-300 transition-colors disabled:opacity-50"
                    >
                      {snapshotSaved ? '✓ Saved' : 'Save Snapshot'}
                    </button>
                    <button
                      onClick={handleRevert}
                      className="flex-1 py-2 px-3 rounded-lg bg-surface-200 text-text-secondary text-xs font-medium hover:bg-surface-300 transition-colors"
                    >
                      Revert
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
