import { NextRequest, NextResponse } from 'next/server';
import { buildAlertEmailHtml, buildAlertSubject } from '@/lib/engine/alert-email';
import type { AlertPayload } from '@/lib/engine/alerts';

export async function POST(req: NextRequest) {
  try {
    const payload: AlertPayload = await req.json();

    // Validate
    if (!payload.alerts?.length || !payload.recipients?.length) {
      return NextResponse.json(
        { error: 'No alerts or recipients' },
        { status: 400 },
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 },
      );
    }

    // Allow payload override for testing; fall back to env var or default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fromAddress = ((payload as unknown as Record<string, unknown>).fromOverride as string)
      || process.env.RESEND_FROM_EMAIL
      || 'alerts@crowdcontroldigital.com';
    const html = buildAlertEmailHtml(payload);
    const subject = buildAlertSubject(payload);

    // Send via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Media Flight <${fromAddress}>`,
        to: payload.recipients,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', detail: error },
        { status: 502 },
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      emailId: result.id,
      alertCount: payload.alerts.length,
      recipientCount: payload.recipients.length,
    });
  } catch (err) {
    console.error('Alert route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
