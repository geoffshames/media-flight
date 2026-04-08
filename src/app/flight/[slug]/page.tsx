import { notFound } from 'next/navigation';
import { FlightClient } from './client';
import { getFlightPlan } from '@/lib/data';

interface FlightPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [
    { slug: 'miguel-caos-uk-eu' },
  ];
}

export default async function FlightPage({ params }: FlightPageProps) {
  const { slug } = await params;
  const flight = getFlightPlan(slug);

  if (!flight) {
    notFound();
  }

  return <FlightClient flight={flight} />;
}
