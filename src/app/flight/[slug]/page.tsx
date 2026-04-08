import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
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

export async function generateMetadata({ params }: FlightPageProps): Promise<Metadata> {
  const { slug } = await params;
  const flight = getFlightPlan(slug);
  if (!flight) return {};

  const title = `${flight.artist} — ${flight.tourName} ${flight.legName} | Media Flight`;
  const description = `Media flight plan for ${flight.artist}'s ${flight.tourName} — ${flight.legName} leg`;

  const ogParams = new URLSearchParams({
    artist: flight.artist,
    tour: flight.tourName,
    leg: flight.legName,
  });

  const ogImageUrl = `/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function FlightPage({ params }: FlightPageProps) {
  const { slug } = await params;
  const flight = getFlightPlan(slug);

  if (!flight) {
    notFound();
  }

  return <FlightClient flight={flight} />;
}
