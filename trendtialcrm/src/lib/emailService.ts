// src/lib/emailService.ts
// Sends email via clara-backend endpoint (/api/marketing/email/send).
// The backend calls Resend API directly with the API key from environment.
// This works in both development and production (no Vite proxy dependency).

// ── Core send function ───────────────────────────────────────────────────────
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ id: string }> {
  const response = await fetch('/api/marketing/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || `Email send failed (${response.status})`);
  }
  return data;
}

// ── Marketing email HTML template ────────────────────────────────────────────
export function buildMarketingEmailHtml(params: {
  subject: string;
  body: string;
  recipientName?: string;
}): string {
  const safeBody = params.body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${params.subject}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;padding:32px 16px}
    .wrap{max-width:600px;margin:0 auto}
    .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)}
    .hdr{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center}
    .hdr h1{color:#fff;font-size:22px;font-weight:700}
    .hdr p{color:rgba(255,255,255,.8);font-size:13px;margin-top:6px}
    .bdy{padding:32px}
    .badge{display:inline-block;background:#ede9fe;color:#6d28d9;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;margin-bottom:18px}
    .bdy-text{color:#374151;font-size:15px;line-height:1.7}
    .ftr{background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb}
    .ftr p{color:#9ca3af;font-size:12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hdr">
        <h1>✨ TrendTial CRM</h1>
        <p>AI-generated message just for you</p>
      </div>
      <div class="bdy">
        <span class="badge">Marketing &middot; AI Generated</span>
        ${params.recipientName ? `<p style="font-size:16px;font-weight:600;color:#111827;margin-bottom:16px">Hi ${params.recipientName},</p>` : ''}
        <p class="bdy-text">${safeBody}</p>
      </div>
      <div class="ftr"><p>Sent via TrendTial CRM &middot; AI-Powered Marketing Suite</p></div>
    </div>
  </div>
</body>
</html>`;
}

// ── Support ticket email HTML template ───────────────────────────────────────
export function buildTicketEmailHtml(params: {
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  customerName: string;
  description?: string;
  category?: string;
  agentReply?: string;
  createdAt?: string;
}): string {
  const priorityColor =
    params.priority === 'critical' ? '#dc2626' :
    params.priority === 'urgent'   ? '#ea580c' :
    params.priority === 'high'     ? '#d97706' : '#16a34a';

  const statusColor =
    params.status === 'open'        ? '#2563eb' :
    params.status === 'in_progress' ? '#d97706' :
    params.status === 'resolved'    ? '#16a34a' : '#6b7280';

  const safeDescription = params.description
    ? params.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
    : '';

  const safeReply = params.agentReply
    ? params.agentReply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
    : '';

  const dateStr = params.createdAt
    ? new Date(params.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })
    : new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Support Ticket ${params.ticketNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;padding:32px 16px}
    .wrap{max-width:600px;margin:0 auto}
    .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)}
    .hdr{background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px}
    .hdr-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
    .hdr-brand{color:rgba(255,255,255,.7);font-size:13px;font-weight:600}
    .ticket-num{background:rgba(255,255,255,.2);color:#fff;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:.3px}
    .hdr h1{color:#fff;font-size:19px;font-weight:700;line-height:1.3}
    .hdr-sub{color:rgba(255,255,255,.8);font-size:13px;margin-top:6px}
    .bdy{padding:28px 32px}
    .meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px}
    .badge{padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600}
    .lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;margin-bottom:8px}
    .box{background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:18px;border-left:3px solid #e5e7eb}
    .box p{color:#374151;font-size:14px;line-height:1.7}
    .reply-box{background:#ede9fe;border-radius:8px;padding:16px;margin-bottom:18px;border-left:3px solid #7c3aed}
    .reply-box p{color:#374151;font-size:14px;line-height:1.7}
    .ftr{background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb}
    .ftr p{color:#9ca3af;font-size:12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hdr">
        <div class="hdr-top">
          <span class="hdr-brand">TrendTial Support</span>
          <span class="ticket-num">${params.ticketNumber}</span>
        </div>
        <h1>${params.subject}</h1>
        <p class="hdr-sub">Hello ${params.customerName}, here is a summary of your support ticket.</p>
      </div>
      <div class="bdy">
        <div class="meta">
          <span class="badge" style="background:${statusColor}22;color:${statusColor}">Status: ${params.status.replace('_', ' ')}</span>
          <span class="badge" style="background:${priorityColor}22;color:${priorityColor}">Priority: ${params.priority}</span>
          ${params.category ? `<span class="badge" style="background:#f3f4f6;color:#374151">${params.category.replace('_', ' ')}</span>` : ''}
        </div>
        ${safeDescription ? `<p class="lbl">Your Request</p><div class="box"><p>${safeDescription}</p></div>` : ''}
        ${safeReply ? `<p class="lbl">Agent Response</p><div class="reply-box"><p>${safeReply}</p></div>` : ''}
        <p style="color:#6b7280;font-size:13px;margin-top:4px">Our team is working on your request. We'll keep you updated.</p>
      </div>
      <div class="ftr">
        <p>TrendTial CRM Support &middot; Ticket ${params.ticketNumber} &middot; ${dateStr}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
