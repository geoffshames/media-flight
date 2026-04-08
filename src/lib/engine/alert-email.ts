/**
 * Branded HTML email builder for Media Flight alerts.
 * CCD design system: #0A0A0A bg, #FD3737 accent, N27 headings, Work Sans body.
 * Uses inline styles for maximum email client compatibility.
 */
import type { AlertPayload, FlightAlert } from './alerts';

function tierColor(tier?: string): string {
  if (!tier) return '#888';
  if (tier.startsWith('green')) return '#00E676';
  if (tier === 'yellow') return '#FFD600';
  if (tier === 'orange') return '#FF9100';
  if (tier === 'red') return '#FF1744';
  return '#888';
}

function severityIcon(severity: 'warning' | 'critical'): string {
  return severity === 'critical' ? '🔴' : '🟡';
}

function alertTypeLabel(type: string): string {
  switch (type) {
    case 'tier_drop': return 'TIER DROP';
    case 'velocity_stall': return 'VELOCITY STALL';
    case 'show_week_urgency': return 'SHOW WEEK';
    default: return 'ALERT';
  }
}

function renderAlert(alert: FlightAlert): string {
  const tierBadge = alert.newTier
    ? `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${tierColor(alert.newTier)}22;color:${tierColor(alert.newTier)};font-size:11px;font-weight:600;letter-spacing:0.05em;margin-left:8px;">${alert.newTier?.replace('_', ' ').toUpperCase()}</span>`
    : '';

  return `
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid #1E1E1E;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:6px;">
              <span style="font-size:10px;letter-spacing:0.15em;color:#FD3737;font-weight:600;">${severityIcon(alert.severity)} ${alertTypeLabel(alert.type)}</span>
              ${tierBadge}
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:4px;">
              <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#FAFAFA;">${alert.headline}</span>
            </td>
          </tr>
          <tr>
            <td>
              <span style="font-size:13px;color:#A0A0A0;line-height:1.5;">${alert.detail}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:16px;">
                    <span style="font-size:11px;color:#666;">SOLD</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#E4E4E7;">${(alert.currentPct * 100).toFixed(0)}%</span>
                  </td>
                  <td style="padding-right:16px;">
                    <span style="font-size:11px;color:#666;">PROJECTED</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#E4E4E7;">${(alert.predictedPct * 100).toFixed(0)}%</span>
                  </td>
                  <td style="padding-right:16px;">
                    <span style="font-size:11px;color:#666;">GAP</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#FD3737;">${alert.gap.toLocaleString()}</span>
                  </td>
                  <td>
                    <span style="font-size:11px;color:#666;">DAYS OUT</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#E4E4E7;">${alert.daysOut}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildAlertEmailHtml(payload: AlertPayload): string {
  const criticalCount = payload.alerts.filter(a => a.severity === 'critical').length;
  const warningCount = payload.alerts.filter(a => a.severity === 'warning').length;

  const subjectLine = criticalCount > 0
    ? `🔴 ${criticalCount} critical alert${criticalCount > 1 ? 's' : ''} — ${payload.artist} ${payload.tourName}`
    : `🟡 ${warningCount} warning${warningCount > 1 ? 's' : ''} — ${payload.artist} ${payload.tourName}`;

  const alertRows = payload.alerts.map(renderAlert).join('');

  const { tierCounts } = payload.summaryStats;

  const brandBaseUrl = 'https://flight.crowdcontroldigital.com/brand';
  const wordmarkUrl = `${brandBaseUrl}/CC-LOGO-2024-WHITE.png`;
  const fontUrl = `${brandBaseUrl}/N27-Bold.otf`;

  // N27 heading font family — works in Apple Mail, iOS, Samsung Mail, Thunderbird.
  // Gmail, Outlook fall back to the system stack.
  const headingFont = "'N27Bold', 'Helvetica Neue', Helvetica, Arial, sans-serif";
  const bodyFont = "'Work Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subjectLine}</title>
  <style>
    @font-face {
      font-family: 'N27Bold';
      src: url('${fontUrl}') format('opentype');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: 'Work Sans';
      src: url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXBi8Jpg.woff2') format('woff2');
      font-weight: 400;
      font-style: normal;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:${bodyFont};">`;
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 20px;border-bottom:1px solid #1E1E1E;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-family:${headingFont};font-size:10px;letter-spacing:0.35em;color:#FD3737;font-weight:700;">MEDIA FLIGHT ALERT</span>
                  </td>
                  <td align="right">
                    <img src="${wordmarkUrl}" alt="Crowd Control Digital" height="18" style="height:18px;opacity:0.7;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Artist / Tour -->
          <tr>
            <td style="padding:28px 20px 12px;">
              <span style="font-family:${headingFont};font-size:28px;font-weight:700;color:#FAFAFA;text-transform:uppercase;letter-spacing:-0.01em;">${payload.artist}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 20px;">
              <span style="font-family:${headingFont};font-size:15px;color:#E4E4E7;">${payload.tourName}</span>
              ${payload.legName ? `<span style="color:#FD3737;margin:0 8px;">·</span><span style="font-size:15px;color:#888;">${payload.legName}</span>` : ''}
            </td>
          </tr>

          <!-- Alert count banner -->
          <tr>
            <td style="padding:0 20px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FD373710;border:1px solid #FD373730;border-radius:8px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <span style="font-size:13px;color:#FD3737;font-weight:600;">
                      ${payload.alerts.length} alert${payload.alerts.length > 1 ? 's' : ''} triggered
                    </span>
                    <span style="font-size:12px;color:#888;margin-left:8px;">
                      ${criticalCount > 0 ? `${criticalCount} critical` : ''}${criticalCount > 0 && warningCount > 0 ? ' · ' : ''}${warningCount > 0 ? `${warningCount} warning${warningCount > 1 ? 's' : ''}` : ''}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Alerts -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0E0E0E;border-radius:8px;overflow:hidden;">
                ${alertRows}
              </table>
            </td>
          </tr>

          <!-- Tour health summary -->
          <tr>
            <td style="padding:24px 20px;">
              <span style="font-family:${headingFont};font-size:10px;letter-spacing:0.2em;color:#666;font-weight:700;">TOUR HEALTH</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 28px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:24px;">
                    <span style="font-size:11px;color:#666;">SELL-THROUGH</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#FAFAFA;">${(payload.summaryStats.overallSellThrough * 100).toFixed(0)}%</span>
                  </td>
                  <td style="padding-right:24px;">
                    <span style="font-size:11px;color:#00E676;">● HEALTHY</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#FAFAFA;">${tierCounts.green}</span>
                  </td>
                  <td style="padding-right:24px;">
                    <span style="font-size:11px;color:#FFD600;">● WATCH</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#FAFAFA;">${tierCounts.yellow}</span>
                  </td>
                  <td style="padding-right:24px;">
                    <span style="font-size:11px;color:#FF9100;">● PUSH</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#FAFAFA;">${tierCounts.orange}</span>
                  </td>
                  <td>
                    <span style="font-size:11px;color:#FF1744;">● CRITICAL</span><br/>
                    <span style="font-family:'N27Bold','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#FAFAFA;">${tierCounts.red}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 20px 32px;">
              <a href="${payload.dashboardUrl}" style="display:inline-block;padding:12px 32px;background:#FD3737;color:#FFFFFF;text-decoration:none;font-family:${headingFont};font-size:13px;font-weight:700;letter-spacing:0.1em;border-radius:6px;">
                VIEW DASHBOARD →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px;border-top:1px solid #1E1E1E;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle">
                    <span style="font-size:11px;color:#444;">Powered by</span>
                    <img src="${wordmarkUrl}" alt="Crowd Control Digital" height="12" style="height:12px;vertical-align:middle;margin-left:4px;opacity:0.5;" />
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#444;">
                      ${new Date(payload.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

export function buildAlertSubject(payload: AlertPayload): string {
  const criticalCount = payload.alerts.filter(a => a.severity === 'critical').length;
  const warningCount = payload.alerts.filter(a => a.severity === 'warning').length;

  if (criticalCount > 0) {
    return `🔴 ${criticalCount} critical alert${criticalCount > 1 ? 's' : ''} — ${payload.artist} ${payload.tourName}`;
  }
  return `🟡 ${warningCount} warning${warningCount > 1 ? 's' : ''} — ${payload.artist} ${payload.tourName}`;
}
