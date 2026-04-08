/**
 * Client-side PDF generator for Media Flight reports.
 * Uses jsPDF with embedded N27 Bold font and CCD branding.
 *
 * Two modes:
 * - Summary: single landscape page with tour overview
 * - Full: summary page + one page per on-sale market
 */
import { jsPDF } from 'jspdf';
import { N27_BOLD_BASE64 } from '@/lib/fonts/n27-bold-base64';
import { CCD_LOGO_BASE64 } from '@/lib/fonts/ccd-logo-base64';
import type { FlightPlan, Market } from '@/lib/types/flight';

// ── Brand constants ──
const BG = '#0A0A0A';
const SURFACE = '#141414';
const SURFACE_LIGHT = '#1E1E1E';
const ACCENT = '#FD3737';
const TEXT_PRIMARY = '#FAFAFA';
const TEXT_SECONDARY = '#E4E4E7';
const TEXT_MUTED = '#888888';
const TIER_GREEN = '#00E676';
const TIER_YELLOW = '#FFD600';
const TIER_ORANGE = '#FF9100';
const TIER_RED = '#FF1744';

type PDFMode = 'summary' | 'full';

function tierColor(tier: string): string {
  if (tier.startsWith('green')) return TIER_GREEN;
  if (tier === 'yellow') return TIER_YELLOW;
  if (tier === 'orange') return TIER_ORANGE;
  if (tier === 'red') return TIER_RED;
  return TEXT_MUTED;
}

function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function setColor(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRGB(hex);
  doc.setTextColor(r, g, b);
}

function setFill(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRGB(hex);
  doc.setFillColor(r, g, b);
}

function setDraw(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRGB(hex);
  doc.setDrawColor(r, g, b);
}

function drawPageBg(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  setFill(doc, BG);
  doc.rect(0, 0, w, h, 'F');
}

function drawHeader(doc: jsPDF, plan: FlightPlan) {
  const w = doc.internal.pageSize.getWidth();

  // Accent line at very top
  setFill(doc, ACCENT);
  doc.rect(0, 0, w, 1.5, 'F');

  // "MEDIA FLIGHT" label
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(7);
  setColor(doc, ACCENT);
  doc.text('MEDIA FLIGHT', 20, 14);

  // CCD logo (right side)
  try {
    doc.addImage(CCD_LOGO_BASE64, 'PNG', w - 55, 8, 40, 10);
  } catch {
    // Fallback text if image fails
    doc.setFontSize(6);
    setColor(doc, TEXT_MUTED);
    doc.text('CROWD CONTROL DIGITAL', w - 20, 14, { align: 'right' });
  }

  // Divider
  setDraw(doc, SURFACE_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(20, 20, w - 20, 20);
}

function drawFooter(doc: jsPDF, plan: FlightPlan) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  setDraw(doc, SURFACE_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(20, h - 15, w - 20, h - 15);

  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(6);
  setColor(doc, TEXT_MUTED);
  doc.text(`${plan.artist} — ${plan.tourName} · ${plan.legName}`, 20, h - 9);
  doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, w - 20, h - 9, { align: 'right' });
}

// ── Summary Page ──

function drawSummaryPage(doc: jsPDF, plan: FlightPlan) {
  drawPageBg(doc);
  drawHeader(doc, plan);
  const w = doc.internal.pageSize.getWidth();

  let y = 30;

  // Artist name
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(32);
  setColor(doc, TEXT_PRIMARY);
  doc.text(plan.artist.toUpperCase(), 20, y);
  y += 10;

  // Tour + leg
  doc.setFontSize(12);
  setColor(doc, TEXT_SECONDARY);
  doc.text(plan.tourName, 20, y);
  setColor(doc, ACCENT);
  const tourWidth = doc.getTextWidth(plan.tourName);
  doc.text(' · ', 20 + tourWidth, y);
  setColor(doc, TEXT_MUTED);
  doc.text(plan.legName, 20 + tourWidth + doc.getTextWidth(' · '), y);
  y += 4;

  // Date range
  doc.setFontSize(8);
  setColor(doc, TEXT_MUTED);
  doc.text(plan.dateRange, 20, y);
  y += 12;

  // ── Stat cards row ──
  const cardW = (w - 60) / 5;
  const cardH = 22;
  const stats = [
    { label: 'MARKETS', value: plan.summary.totalMarkets.toString(), color: TEXT_PRIMARY },
    { label: 'SELL-THROUGH', value: `${(plan.summary.avgSellThrough * 100).toFixed(0)}%`, color: TEXT_PRIMARY },
    { label: 'TICKETS SOLD', value: plan.summary.totalSold.toLocaleString(), color: TEXT_PRIMARY },
    { label: 'CAPACITY', value: plan.summary.totalCapacity.toLocaleString(), color: TEXT_PRIMARY },
    { label: 'PREDICTED GAP', value: plan.summary.totalPredictedGap.toLocaleString(), color: ACCENT },
  ];

  stats.forEach((stat, i) => {
    const x = 20 + i * (cardW + 5);
    setFill(doc, SURFACE);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'F');

    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(6);
    setColor(doc, TEXT_MUTED);
    doc.text(stat.label, x + 6, y + 8);

    doc.setFontSize(16);
    setColor(doc, stat.color);
    doc.text(stat.value, x + 6, y + 18);
  });

  y += cardH + 10;

  // ── Tier breakdown ──
  const tierW = (w - 60) / 4;
  const tiers = [
    { label: 'HEALTHY', count: plan.summary.tierCounts.green, color: TIER_GREEN },
    { label: 'WATCH', count: plan.summary.tierCounts.yellow, color: TIER_YELLOW },
    { label: 'PUSH', count: plan.summary.tierCounts.orange, color: TIER_ORANGE },
    { label: 'CRITICAL', count: plan.summary.tierCounts.red, color: TIER_RED },
  ];

  tiers.forEach((tier, i) => {
    const x = 20 + i * (tierW + 5);
    setFill(doc, SURFACE);
    doc.roundedRect(x, y, tierW, 18, 2, 2, 'F');

    // Color bar at top
    setFill(doc, tier.color);
    doc.rect(x, y, tierW, 2, 'F');

    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(6);
    setColor(doc, tier.color);
    doc.text(`● ${tier.label}`, x + 6, y + 9);

    doc.setFontSize(14);
    setColor(doc, TEXT_PRIMARY);
    doc.text(tier.count.toString(), x + tierW - 8, y + 13, { align: 'right' });
  });

  y += 28;

  // ── Budget recommendations ──
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(7);
  setColor(doc, TEXT_MUTED);
  doc.text('RECOMMENDED BUDGETS', 20, y);
  y += 6;

  plan.summary.budgetRecommendations.forEach((b, i) => {
    const x = 20 + i * 80;
    setFill(doc, SURFACE);
    doc.roundedRect(x, y, 72, 16, 2, 2, 'F');

    doc.setFontSize(6);
    setColor(doc, TEXT_MUTED);
    doc.text(`@ $${b.rate}/TICKET`, x + 6, y + 6);

    doc.setFontSize(12);
    setColor(doc, TEXT_PRIMARY);
    doc.text(`$${b.totalBudget.toLocaleString()}`, x + 6, y + 13);
  });

  y += 26;

  // ── Market table ──
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(7);
  setColor(doc, TEXT_MUTED);
  doc.text('MARKET OVERVIEW', 20, y);
  y += 6;

  // Table header
  const cols = [
    { label: 'MARKET', x: 20, width: 55 },
    { label: 'DATE', x: 75, width: 28 },
    { label: 'CAPACITY', x: 103, width: 25 },
    { label: 'SOLD', x: 128, width: 20 },
    { label: '% SOLD', x: 148, width: 20 },
    { label: 'PROJECTED', x: 168, width: 25 },
    { label: 'GAP', x: 193, width: 20 },
    { label: 'TIER', x: 213, width: 30 },
    { label: 'BUDGET', x: 243, width: 30 },
  ];

  setFill(doc, SURFACE);
  doc.rect(20, y, w - 40, 6, 'F');
  doc.setFontSize(5);
  setColor(doc, TEXT_MUTED);
  cols.forEach(col => {
    doc.text(col.label, col.x + 2, y + 4);
  });
  y += 7;

  // Table rows
  const onSaleMarkets = plan.markets.filter(m => m.status !== 'played');
  onSaleMarkets.forEach((market, i) => {
    if (y > doc.internal.pageSize.getHeight() - 25) return; // Safety

    const rowBg = i % 2 === 0 ? BG : SURFACE;
    setFill(doc, rowBg);
    doc.rect(20, y - 1, w - 40, 6, 'F');

    doc.setFontSize(5.5);

    // City
    setColor(doc, TEXT_PRIMARY);
    doc.text(market.city, 22, y + 3);

    // Date
    setColor(doc, TEXT_MUTED);
    doc.text(new Date(market.showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 77, y + 3);

    // Capacity
    setColor(doc, TEXT_SECONDARY);
    doc.text(market.capacity.toLocaleString(), 105, y + 3);

    // Sold
    doc.text(market.ticketsSold.toLocaleString(), 130, y + 3);

    // % Sold
    setColor(doc, TEXT_PRIMARY);
    doc.text(`${(market.pctSold * 100).toFixed(0)}%`, 150, y + 3);

    // Projected
    doc.text(`${(market.prediction.blendedPredPct * 100).toFixed(0)}%`, 170, y + 3);

    // Gap
    setColor(doc, market.prediction.gap > 0 ? ACCENT : TIER_GREEN);
    doc.text(market.prediction.gap.toLocaleString(), 195, y + 3);

    // Tier
    setColor(doc, tierColor(market.prediction.tier));
    doc.text(market.prediction.tierLabel, 215, y + 3);

    // Budget (first rate)
    setColor(doc, TEXT_SECONDARY);
    const budget = market.prediction.budgets[0];
    doc.text(budget ? `$${budget.amount.toLocaleString()}` : '—', 245, y + 3);

    y += 6;
  });

  drawFooter(doc, plan);
}

// ── Market Detail Page ──

function drawMarketPage(doc: jsPDF, plan: FlightPlan, market: Market) {
  doc.addPage();
  drawPageBg(doc);
  drawHeader(doc, plan);
  const w = doc.internal.pageSize.getWidth();

  let y = 30;

  // Market name + tier badge
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(22);
  setColor(doc, TEXT_PRIMARY);
  doc.text(market.city.toUpperCase(), 20, y);

  // Tier badge
  const tc = tierColor(market.prediction.tier);
  const badgeX = 20 + doc.getTextWidth(market.city.toUpperCase()) + 6;
  setFill(doc, tc + '33');
  doc.roundedRect(badgeX, y - 6, doc.getTextWidth(market.prediction.tierLabel) * 0.45 + 10, 8, 1.5, 1.5, 'F');
  doc.setFontSize(6);
  setColor(doc, tc);
  doc.text(market.prediction.tierLabel.toUpperCase(), badgeX + 5, y - 1);

  y += 6;

  // Venue + date
  doc.setFontSize(9);
  setColor(doc, TEXT_SECONDARY);
  doc.text(market.venue, 20, y);
  setColor(doc, TEXT_MUTED);
  const venueW = doc.getTextWidth(market.venue);
  doc.text(` · ${new Date(market.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`, 20 + venueW, y);
  y += 4;
  doc.setFontSize(7);
  doc.text(`${market.country} · ${market.daysOut} days to show`, 20, y);
  y += 12;

  // ── Key metrics cards ──
  const metricCards = [
    { label: 'TICKETS SOLD', value: market.ticketsSold.toLocaleString(), sub: `of ${market.capacity.toLocaleString()}`, color: TEXT_PRIMARY },
    { label: '% SOLD', value: `${(market.pctSold * 100).toFixed(0)}%`, sub: 'current', color: TEXT_PRIMARY },
    { label: 'PROJECTED', value: `${(market.prediction.blendedPredPct * 100).toFixed(0)}%`, sub: `${market.prediction.predictedSold.toLocaleString()} tickets`, color: TEXT_SECONDARY },
    { label: 'GAP TO SELLOUT', value: market.prediction.gap.toLocaleString(), sub: 'tickets', color: ACCENT },
    { label: 'CONFIDENCE', value: market.prediction.confidence.toUpperCase(), sub: '', color: market.prediction.confidence === 'high' ? TIER_GREEN : market.prediction.confidence === 'medium' ? TIER_YELLOW : TIER_RED },
  ];

  const mcW = (w - 60) / 5;
  metricCards.forEach((mc, i) => {
    const x = 20 + i * (mcW + 5);
    setFill(doc, SURFACE);
    doc.roundedRect(x, y, mcW, 24, 2, 2, 'F');

    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(mc.label, x + 5, y + 7);

    doc.setFontSize(14);
    setColor(doc, mc.color);
    doc.text(mc.value, x + 5, y + 16);

    if (mc.sub) {
      doc.setFontSize(5.5);
      setColor(doc, TEXT_MUTED);
      doc.text(mc.sub, x + 5, y + 21);
    }
  });

  y += 34;

  // ── Velocity section ──
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(7);
  setColor(doc, TEXT_MUTED);
  doc.text('VELOCITY ANALYSIS', 20, y);
  y += 7;

  const velCards = [
    { label: 'AVG WEEKLY', value: Math.round(market.avgWeeklyVelocity).toLocaleString(), sub: 'tickets/week' },
    { label: 'RECENT WEEKLY', value: Math.round(market.recentWeeklyVelocity).toLocaleString(), sub: 'tickets/week' },
    { label: 'REQUIRED WEEKLY', value: Math.round(market.prediction.requiredWeeklyVelocity).toLocaleString(), sub: 'to sell out' },
    { label: 'VELOCITY GAP', value: Math.round(market.prediction.velocityGap).toLocaleString(), sub: 'per week shortfall' },
    { label: 'TREND', value: market.velocityTrend.toUpperCase(), sub: '' },
  ];

  velCards.forEach((vc, i) => {
    const x = 20 + i * (mcW + 5);
    setFill(doc, SURFACE);
    doc.roundedRect(x, y, mcW, 20, 2, 2, 'F');

    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(vc.label, x + 5, y + 7);

    doc.setFontSize(11);
    const trendColor = vc.label === 'TREND'
      ? (market.velocityTrend === 'accelerating' ? TIER_GREEN : market.velocityTrend === 'decelerating' ? TIER_RED : TIER_YELLOW)
      : TEXT_PRIMARY;
    setColor(doc, trendColor);
    doc.text(vc.value, x + 5, y + 14);

    if (vc.sub) {
      doc.setFontSize(5);
      setColor(doc, TEXT_MUTED);
      doc.text(vc.sub, x + 5, y + 18);
    }
  });

  y += 30;

  // ── Budget recommendations ──
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(7);
  setColor(doc, TEXT_MUTED);
  doc.text('MEDIA BUDGET', 20, y);
  y += 7;

  market.prediction.budgets.forEach((b, i) => {
    const x = 20 + i * 80;
    setFill(doc, SURFACE);
    doc.roundedRect(x, y, 72, 18, 2, 2, 'F');

    // Accent top bar
    setFill(doc, ACCENT);
    doc.rect(x, y, 72, 1.5, 'F');

    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(`@ $${b.rate}/TICKET`, x + 6, y + 7);

    doc.setFontSize(14);
    setColor(doc, TEXT_PRIMARY);
    doc.text(`$${b.amount.toLocaleString()}`, x + 6, y + 15);
  });

  y += 28;

  // ── Pacing note ──
  if (market.pacingNote) {
    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(7);
    setColor(doc, TEXT_MUTED);
    doc.text('PACING NOTE', 20, y);
    y += 6;

    setFill(doc, SURFACE);
    doc.roundedRect(20, y, w - 40, 14, 2, 2, 'F');
    doc.setFontSize(7);
    setColor(doc, TEXT_SECONDARY);
    const lines = doc.splitTextToSize(market.pacingNote, w - 52);
    doc.text(lines, 26, y + 6);
  }

  // ── Pacing progress bar ──
  y += 22;
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(7);
  setColor(doc, TEXT_MUTED);
  doc.text('SELL-THROUGH PROGRESS', 20, y);
  y += 6;

  const barW = w - 40;
  const barH = 8;
  setFill(doc, SURFACE);
  doc.roundedRect(20, y, barW, barH, 2, 2, 'F');

  // Fill
  const fillW = Math.min(market.pctSold, 1) * barW;
  setFill(doc, tierColor(market.prediction.tier));
  doc.roundedRect(20, y, Math.max(fillW, 4), barH, 2, 2, 'F');

  // Projected marker
  const projX = 20 + Math.min(market.prediction.blendedPredPct, 1) * barW;
  setDraw(doc, TEXT_MUTED);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(projX, y - 1, projX, y + barH + 1);
  doc.setLineDashPattern([], 0);

  // Labels
  doc.setFontSize(5);
  setColor(doc, TEXT_PRIMARY);
  doc.text(`${(market.pctSold * 100).toFixed(0)}%`, 20 + fillW + 3, y + 5.5);

  setColor(doc, TEXT_MUTED);
  doc.text(`proj: ${(market.prediction.blendedPredPct * 100).toFixed(0)}%`, projX + 3, y - 2);

  drawFooter(doc, plan);
}

// ── Main export ──

export function generateFlightPDF(plan: FlightPlan, mode: PDFMode = 'summary'): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Register N27 Bold font (TTF format required for jsPDF glyph mapping)
  doc.addFileToVFS('N27-Bold.ttf', N27_BOLD_BASE64);
  doc.addFont('N27-Bold.ttf', 'N27Bold', 'bold');

  // Summary page (always included)
  drawSummaryPage(doc, plan);

  // Market detail pages (full mode only)
  if (mode === 'full') {
    const onSaleMarkets = plan.markets.filter(m => m.status !== 'played');
    for (const market of onSaleMarkets) {
      drawMarketPage(doc, plan, market);
    }
  }

  // Download
  const filename = mode === 'summary'
    ? `${plan.slug}-summary.pdf`
    : `${plan.slug}-full-report.pdf`;
  doc.save(filename);
}
