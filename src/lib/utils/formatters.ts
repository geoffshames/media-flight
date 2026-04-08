export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateFull(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getStatusLabel(tier: string): string {
  switch (tier) {
    case 'green_sold_out': return 'SOLD OUT';
    case 'green_on_pace': return 'ON PACE';
    case 'yellow': return 'ON PACE';
    case 'orange': return 'NEEDS PUSH';
    case 'red': return 'CRITICAL';
    default: return 'UNKNOWN';
  }
}

/** Subtle monochrome badge — no bright tier fills */
export function getStatusBadge(tier: string): string {
  switch (tier) {
    case 'green_sold_out':
    case 'green_on_pace':
      return 'bg-surface-100 text-text-secondary border border-surface-200';
    case 'yellow':
      return 'bg-surface-100 text-text-secondary border border-surface-200';
    case 'orange':
      return 'bg-surface-100 text-text-secondary border border-surface-200';
    case 'red':
      return 'bg-surface-100 text-text-primary border border-surface-200';
    default:
      return 'bg-surface-100 text-text-muted border border-surface-200';
  }
}

/** Returns a tiny tier accent color for left-bar or dot — the only place tier color appears */
export function tierAccentColor(tier: string): string {
  switch (tier) {
    case 'green_sold_out':
    case 'green_on_pace': return '#00E676';
    case 'yellow': return '#FFD600';
    case 'orange': return '#FF9100';
    case 'red': return '#FF1744';
    default: return '#333333';
  }
}

/** Bg class for tier — kept very subtle, just a border tint */
export function tierBg(_tier: string): string {
  return 'bg-surface-50/80 border-surface-200';
}

export function tierTextColor(tier: string): string {
  switch (tier) {
    case 'green_sold_out':
    case 'green_on_pace': return 'text-text-primary';
    case 'yellow': return 'text-text-primary';
    case 'orange': return 'text-text-primary';
    case 'red': return 'text-text-primary';
    default: return 'text-text-primary';
  }
}
