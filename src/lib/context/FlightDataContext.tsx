'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { FlightPlan, DiffSummary, PredictionSnapshot } from '@/lib/types/flight';

interface FlightDataContextValue {
  data: FlightPlan;
  originalData: FlightPlan;
  isUpdated: boolean;
  diffSummary: DiffSummary | null;
  snapshots: PredictionSnapshot[];
  applyUpdate: (newData: FlightPlan, diff: DiffSummary) => void;
  revert: () => void;
  saveSnapshot: (snapshot: PredictionSnapshot) => void;
}

const FlightDataContext = createContext<FlightDataContextValue | null>(null);

export function FlightDataProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: FlightPlan;
}) {
  const [originalData] = useState<FlightPlan>(initialData);
  const [currentData, setCurrentData] = useState<FlightPlan>(initialData);
  const [diffSummary, setDiffSummary] = useState<DiffSummary | null>(null);
  const [isUpdated, setIsUpdated] = useState(false);
  const [snapshots, setSnapshots] = useState<PredictionSnapshot[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`media-flight-snapshots-${initialData.slug}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const applyUpdate = useCallback((newData: FlightPlan, diff: DiffSummary) => {
    setCurrentData(newData);
    setDiffSummary(diff);
    setIsUpdated(true);
  }, []);

  const revert = useCallback(() => {
    setCurrentData(originalData);
    setDiffSummary(null);
    setIsUpdated(false);
  }, [originalData]);

  const saveSnapshot = useCallback((snapshot: PredictionSnapshot) => {
    setSnapshots(prev => {
      const next = [...prev, snapshot];
      try {
        localStorage.setItem(
          `media-flight-snapshots-${originalData.slug}`,
          JSON.stringify(next)
        );
      } catch { /* localStorage full or unavailable */ }
      return next;
    });
  }, [originalData.slug]);

  return (
    <FlightDataContext.Provider value={{
      data: currentData,
      originalData,
      isUpdated,
      diffSummary,
      snapshots,
      applyUpdate,
      revert,
      saveSnapshot,
    }}>
      {children}
    </FlightDataContext.Provider>
  );
}

export function useFlightData(): FlightDataContextValue {
  const ctx = useContext(FlightDataContext);
  if (!ctx) throw new Error('useFlightData must be used within FlightDataProvider');
  return ctx;
}
