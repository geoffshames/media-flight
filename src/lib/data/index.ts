import { FlightPlan } from '@/lib/types/flight';
import { miguelCaosUkEu } from './miguel-caos-uk-eu';

export const allFlightPlans: Record<string, FlightPlan> = {
  'miguel-caos-uk-eu': miguelCaosUkEu,
};

export function getFlightPlan(slug: string): FlightPlan | null {
  return allFlightPlans[slug] ?? null;
}
