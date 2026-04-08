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

  // CCD wordmark (right side) — actual ratio is ~7.16:1
  const logoH = 4.5;
  const logoW = logoH * 7.16;
  try {
    doc.addImage(CCD_LOGO_BASE64, 'PNG', w - 15 - logoW, 9, logoW, logoH);
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

function drawSummaryPage(doc: jsPDF, plan: FlightPlan, mode: PDFMode = 'summary') {
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

  // ── Stat cards — 3 + 2 rows for portrait ──
  const margin = 15;
  const contentW = w - margin * 2;
  const gap = 4;

  // Row 1: 3 cards
  const card3W = (contentW - gap * 2) / 3;
  const cardH = 22;
  const statsRow1 = [
    { label: 'MARKETS', value: plan.summary.totalMarkets.toString(), color: TEXT_PRIMARY },
    { label: 'SELL-THROUGH', value: `${(plan.summary.avgSellThrough * 100).toFixed(0)}%`, color: TEXT_PRIMARY },
    { label: 'TICKETS SOLD', value: plan.summary.totalSold.toLocaleString(), color: TEXT_PRIMARY },
  ];
  statsRow1.forEach((stat, i) => {
    const x = margin + i * (card3W + gap);
    drawCard(doc, x, y, card3W, cardH);
    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(stat.label, x + 6, y + 8);
    doc.setFontSize(14);
    setColor(doc, stat.color);
    doc.text(stat.value, x + 6, y + 17.5);
  });
  y += cardH + gap;

  // Row 2: 2 cards
  const card2W = (contentW - gap) / 2;
  const statsRow2 = [
    { label: 'CAPACITY', value: plan.summary.totalCapacity.toLocaleString(), color: TEXT_PRIMARY },
    { label: 'PREDICTED GAP', value: plan.summary.totalPredictedGap.toLocaleString(), color: ACCENT },
  ];
  statsRow2.forEach((stat, i) => {
    const x = margin + i * (card2W + gap);
    drawCard(doc, x, y, card2W, cardH);
    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(stat.label, x + 6, y + 8);
    doc.setFontSize(14);
    setColor(doc, stat.color);
    doc.text(stat.value, x + 6, y + 17.5);
  });
  y += cardH + 8;

  // ── Tier breakdown — 4 cards in one row ──
  const tierW = (contentW - gap * 3) / 4;
  const tiers = [
    { label: 'HEALTHY', count: plan.summary.tierCounts.green, color: TIER_GREEN },
    { label: 'WATCH', count: plan.summary.tierCounts.yellow, color: TIER_YELLOW },
    { label: 'PUSH', count: plan.summary.tierCounts.orange, color: TIER_ORANGE },
    { label: 'CRITICAL', count: plan.summary.tierCounts.red, color: TIER_RED },
  ];

  tiers.forEach((tier, i) => {
    const x = margin + i * (tierW + gap);
    drawCard(doc, x, y, tierW, 18, { topAccent: tier.color });
    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);
    setColor(doc, tier.color);
    doc.text(tier.label, x + 6, y + 9);
    doc.setFontSize(14);
    setColor(doc, TEXT_PRIMARY);
    doc.text(tier.count.toString(), x + tierW - 8, y + 14, { align: 'right' });
  });

  y += 26;

  // ── Budget recommendations — side by side ──
  drawSectionLabel(doc, 'RECOMMENDED BUDGETS', margin, y);
  y += 5;

  const budgetW = (contentW - gap) / 2;
  plan.summary.budgetRecommendations.forEach((b, i) => {
    const x = margin + i * (budgetW + gap);
    drawCard(doc, x, y, budgetW, 16, { topAccent: ACCENT });
    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(`@ $${b.rate}/TICKET`, x + 6, y + 7);
    doc.setFontSize(12);
    setColor(doc, TEXT_PRIMARY);
    doc.text(`$${b.totalBudget.toLocaleString()}`, x + 6, y + 14);
  });

  y += 24;

  // ── Market table — always starts on its own page in full mode ──
  // In summary mode it flows inline; in full mode it gets a dedicated landscape page
  if (mode === 'full') {
    drawFooter(doc, plan);
    doc.addPage('a4', 'landscape');
    drawPageBg(doc);
    drawHeader(doc, plan);
    y = 28;
  }

  drawSectionLabel(doc, 'MARKET OVERVIEW', margin, y);
  y += 6;

  // Recalculate widths for the current page (may be landscape or portrait)
  const tblPageW = doc.internal.pageSize.getWidth();
  const tblMargin = margin;
  const tblContentW = tblPageW - tblMargin * 2;
  const tblX = tblMargin;

  // Column proportions — spread across full available width
  const colProps = [
    { label: 'MARKET',  pct: 0.18 },
    { label: 'DATE',    pct: 0.10 },
    { label: 'CAP',     pct: 0.10 },
    { label: 'SOLD',    pct: 0.10 },
    { label: '%',       pct: 0.08 },
    { label: 'PROJ',    pct: 0.08 },
    { label: 'GAP',     pct: 0.10 },
    { label: 'TIER',    pct: 0.14 },
    { label: 'BUDGET',  pct: 0.12 },
  ];
  let colX = tblX;
  const cols = colProps.map(cp => {
    const colW = tblContentW * cp.pct;
    const col = { label: cp.label, x: colX, w: colW };
    colX += colW;
    return col;
  });

  // Table header
  setFill(doc, SURFACE);
  doc.roundedRect(tblX, y, tblContentW, 6, 1.5, 1.5, 'F');
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(4.5);
  setColor(doc, TEXT_MUTED);
  cols.forEach(col => {
    doc.text(col.label, col.x + 4, y + 4);
  });
  y += 7.5;

  // Table rows — all markets
  const onSaleMarkets = plan.markets.filter(m => m.status !== 'played');
  const rowH = 7;
  onSaleMarkets.forEach((market, i) => {
    // Add page if needed
    if (y > doc.internal.pageSize.getHeight() - 22) {
      drawFooter(doc, plan);
      doc.addPage('a4', mode === 'summary' ? 'portrait' : 'landscape');
      drawPageBg(doc);
      drawHeader(doc, plan);
      y = 28;
      // Redraw table header
      setFill(doc, SURFACE);
      doc.roundedRect(tblX, y, tblContentW, 6, 1.5, 1.5, 'F');
      doc.setFont('N27Bold', 'bold');
      doc.setFontSize(4.5);
      setColor(doc, TEXT_MUTED);
      cols.forEach(col => {
        doc.text(col.label, col.x + 4, y + 4);
      });
      y += 7.5;
    }

    // Alternating row background
    const rowBg = i % 2 === 0 ? BG : SURFACE;
    setFill(doc, rowBg);
    doc.rect(tblX, y - 2, tblContentW, rowH, 'F');

    // Subtle row separator
    if (i > 0) {
      setDraw(doc, SURFACE_LIGHT);
      doc.setLineWidth(0.15);
      doc.line(tblX + 4, y - 2, tblX + tblContentW - 4, y - 2);
    }

    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);

    // City
    setColor(doc, TEXT_PRIMARY);
    doc.text(market.city, cols[0].x + 4, y + 2);

    // Date
    setColor(doc, TEXT_MUTED);
    doc.text(new Date(market.showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cols[1].x + 4, y + 2);

    // Capacity
    setColor(doc, TEXT_SECONDARY);
    doc.text(market.capacity.toLocaleString(), cols[2].x + 4, y + 2);

    // Sold
    doc.text(market.ticketsSold.toLocaleString(), cols[3].x + 4, y + 2);

    // % Sold
    setColor(doc, TEXT_PRIMARY);
    doc.text(`${(market.pctSold * 100).toFixed(0)}%`, cols[4].x + 4, y + 2);

    // Projected
    doc.text(`${(market.prediction.blendedPredPct * 100).toFixed(0)}%`, cols[5].x + 4, y + 2);

    // Gap
    setColor(doc, market.prediction.gap > 0 ? ACCENT : TIER_GREEN);
    doc.text(market.prediction.gap.toLocaleString(), cols[6].x + 4, y + 2);

    // Tier — short label
    setColor(doc, tierColor(market.prediction.tier));
    doc.text(shortTierLabel(market.prediction.tier), cols[7].x + 4, y + 2);

    // Budget (first rate)
    setColor(doc, TEXT_SECONDARY);
    const budget = market.prediction.budgets[0];
    doc.text(budget ? `$${budget.amount.toLocaleString()}` : '—', cols[8].x + 4, y + 2);

    y += rowH;
  });

  drawFooter(doc, plan);
}

// ── Helpers for premium card drawing ──

function drawCard(doc: jsPDF, x: number, y: number, w: number, h: number, opts?: { topAccent?: string }) {
  // Card background
  setFill(doc, SURFACE);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F');
  // Subtle border
  setDraw(doc, SURFACE_LIGHT);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'S');
  // Optional accent bar at top
  if (opts?.topAccent) {
    setFill(doc, opts.topAccent);
    doc.rect(x + 0.5, y, w - 1, 1.2, 'F');
  }
}

function drawSectionLabel(doc: jsPDF, label: string, x: number, y: number) {
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(6.5);
  setColor(doc, TEXT_MUTED);
  doc.text(label, x, y);
}

// ── Market Detail Page ──

function shortTierLabel(tier: string): string {
  if (tier.startsWith('green')) return 'Healthy';
  if (tier === 'yellow') return 'Watch';
  if (tier === 'orange') return 'Push';
  if (tier === 'red') return 'Critical';
  return tier;
}

function drawMarketPage(doc: jsPDF, plan: FlightPlan, market: Market) {
  doc.addPage('a4', 'landscape');
  drawPageBg(doc);
  drawHeader(doc, plan);
  const w = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = w - margin * 2;

  let y = 28;

  // ── City name ──
  doc.setFont('N27Bold', 'bold');
  doc.setFontSize(24);
  setColor(doc, TEXT_PRIMARY);
  doc.text(market.city.toUpperCase(), margin, y);

  // ── Tier pill badge — short label, centered text ──
  const tc = tierColor(market.prediction.tier);
  const tierText = shortTierLabel(market.prediction.tier).toUpperCase();
  // Measure city width at the heading font size
  const cityW = doc.getTextWidth(market.city.toUpperCase());
  doc.setFontSize(7);
  const tierTextW = doc.getTextWidth(tierText);
  const badgePadX = 6;
  const badgeW = tierTextW + badgePadX * 2;
  const badgeH = 7;
  const badgeX = margin + cityW + 8;
  const badgeY = y - 5.5;

  // Badge background
  setFill(doc, SURFACE_LIGHT);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3.5, 3.5, 'F');
  // Badge border in tier color
  setDraw(doc, tc);
  doc.setLineWidth(0.4);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3.5, 3.5, 'S');
  // Badge text — manually centered (align:'center' unreliable with custom fonts)
  setColor(doc, tc);
  const tierTextActualW = doc.getTextWidth(tierText);
  doc.text(tierText, badgeX + (badgeW - tierTextActualW) / 2, badgeY + badgeH / 2 + 1.5);

  y += 7;

  // Venue + date on one line
  doc.setFontSize(8.5);
  setColor(doc, TEXT_SECONDARY);
  doc.text(market.venue, margin, y);
  setColor(doc, TEXT_MUTED);
  const venueW = doc.getTextWidth(market.venue);
  doc.text(` · ${new Date(market.showDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`, margin + venueW, y);
  y += 5;
  doc.setFontSize(7);
  doc.text(`${market.country} · ${market.daysOut} days to show`, margin, y);
  y += 10;

  // ── Key metrics — 5 cards across ──
  const gap = 4;
  const mcW = (contentW - gap * 4) / 5;
  const mcH = 26;

  const metricCards = [
    { label: 'TICKETS SOLD', value: market.ticketsSold.toLocaleString(), sub: `of ${market.capacity.toLocaleString()}`, color: TEXT_PRIMARY },
    { label: '% SOLD', value: `${(market.pctSold * 100).toFixed(0)}%`, sub: 'current', color: TEXT_PRIMARY },
    { label: 'PROJECTED', value: `${(market.prediction.blendedPredPct * 100).toFixed(0)}%`, sub: `${market.prediction.predictedSold.toLocaleString()} tickets`, color: TEXT_SECONDARY },
    { label: 'GAP TO SELLOUT', value: market.prediction.gap.toLocaleString(), sub: 'tickets', color: ACCENT },
    { label: 'CONFIDENCE', value: market.prediction.confidence.toUpperCase(), sub: '', color: market.prediction.confidence === 'high' ? TIER_GREEN : market.prediction.confidence === 'medium' ? TIER_YELLOW : TIER_RED },
  ];

  metricCards.forEach((mc, i) => {
    const x = margin + i * (mcW + gap);
    drawCard(doc, x, y, mcW, mcH);

    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(mc.label, x + 6, y + 8);

    doc.setFontSize(15);
    setColor(doc, mc.color);
    doc.text(mc.value, x + 6, y + 17);

    if (mc.sub) {
      doc.setFontSize(5);
      setColor(doc, TEXT_MUTED);
      doc.text(mc.sub, x + 6, y + 22.5);
    }
  });

  y += mcH + 10;

  // ── Velocity section ──
  drawSectionLabel(doc, 'VELOCITY ANALYSIS', margin, y);
  y += 6;

  const velH = 22;
  const velCards = [
    { label: 'AVG WEEKLY', value: Math.round(market.avgWeeklyVelocity).toLocaleString(), sub: 'tickets/week' },
    { label: 'RECENT WEEKLY', value: Math.round(market.recentWeeklyVelocity).toLocaleString(), sub: 'tickets/week' },
    { label: 'REQUIRED WEEKLY', value: Math.round(market.prediction.requiredWeeklyVelocity).toLocaleString(), sub: 'to sell out' },
    { label: 'VELOCITY GAP', value: Math.round(market.prediction.velocityGap).toLocaleString(), sub: 'per week shortfall' },
    { label: 'TREND', value: market.velocityTrend.toUpperCase(), sub: '' },
  ];

  velCards.forEach((vc, i) => {
    const x = margin + i * (mcW + gap);
    drawCard(doc, x, y, mcW, velH);

    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(vc.label, x + 6, y + 8);

    doc.setFontSize(12);
    const trendColor = vc.label === 'TREND'
      ? (market.velocityTrend === 'accelerating' ? TIER_GREEN : market.velocityTrend === 'decelerating' ? TIER_RED : TIER_YELLOW)
      : TEXT_PRIMARY;
    setColor(doc, trendColor);
    doc.text(vc.value, x + 6, y + 16);

    if (vc.sub) {
      doc.setFontSize(5);
      setColor(doc, TEXT_MUTED);
      doc.text(vc.sub, x + 6, y + 20);
    }
  });

  y += velH + 10;

  // ── Budget recommendations ──
  drawSectionLabel(doc, 'MEDIA BUDGET', margin, y);
  y += 6;

  const budgetW = (contentW - gap) / 2;
  const budgetH = 20;
  market.prediction.budgets.forEach((b, i) => {
    const x = margin + i * (budgetW + gap);
    drawCard(doc, x, y, budgetW, budgetH, { topAccent: ACCENT });

    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(5.5);
    setColor(doc, TEXT_MUTED);
    doc.text(`@ $${b.rate}/TICKET`, x + 8, y + 8);

    doc.setFontSize(14);
    setColor(doc, TEXT_PRIMARY);
    doc.text(`$${b.amount.toLocaleString()}`, x + 8, y + 17);
  });

  y += budgetH + 10;

  // ── Pacing note — color-coded by tier ──
  if (market.pacingNote) {
    drawSectionLabel(doc, 'PACING NOTE', margin, y);
    y += 6;

    const tc = tierColor(market.prediction.tier);
    const noteH = 14;
    drawCard(doc, margin, y, contentW, noteH, { topAccent: tc });
    doc.setFont('N27Bold', 'bold');
    doc.setFontSize(7);
    setColor(doc, tc);
    const lines = doc.splitTextToSize(market.pacingNote, contentW - 16);
    doc.text(lines, margin + 8, y + 7);
  }

  drawFooter(doc, plan);
}

// ── Main export ──

export function generateFlightPDF(plan: FlightPlan, mode: PDFMode = 'summary'): void {
  const doc = new jsPDF({
    orientation: mode === 'summary' ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Register N27 Bold font (TTF format required for jsPDF glyph mapping)
  doc.addFileToVFS('N27-Bold.ttf', N27_BOLD_BASE64);
  doc.addFont('N27-Bold.ttf', 'N27Bold', 'bold');

  // Summary page (always included)
  drawSummaryPage(doc, plan, mode);

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
