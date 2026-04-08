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

export function tierBg(tier: string): string {
  switch (tier) {
    case 'green_sold_out':
    case 'green_on_pace': return 'bg-tier-green/10 border-tier-green/30';
    case 'yellow': return 'bg-tier-yellow/10 border-tier-yellow/30';
    case 'orange': return 'bg-tier-orange/10 border-tier-orange/30';
    case 'red': return 'bg-tier-red/10 border-tier-red/30';
    default: return 'bg-surface-50 border-surface-200';
  }
}

export function tierTextColor(tier: string): string {
  switch (tier) {
    case 'green_sold_out':
    case 'green_on_pace': return 'text-tier-green';
    case 'yellow': return 'text-tier-yellow';
    case 'orange': return 'text-tier-orange';
    case 'red': return 'text-tier-red';
    default: return 'text-text-primary';
  }
}
