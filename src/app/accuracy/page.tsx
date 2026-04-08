import { accuracyLog } from '@/lib/data/accuracy-log';
import calibration from '@/lib/data/calibration.json';
import { AccuracyClient } from './client';
import type { CalibrationData } from '@/lib/types/flight';

export const metadata = {
  title: 'Model Accuracy Tracker | Media Flight',
  description: 'Prediction accuracy analysis across all tours',
};

export default function AccuracyPage() {
  return (
    <AccuracyClient
      records={accuracyLog}
      calibration={calibration as CalibrationData}
    />
  );
}
