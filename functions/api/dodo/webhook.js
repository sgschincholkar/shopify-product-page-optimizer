function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function verifyStandardWebhook(request, rawBody, secret) {
  if (!secret) return false;
  const id = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp');
  const signatureHeader = request.headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) return false;
  const secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const signedContent = new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`);
  const signatures = signatureHeader.split(' ').map((part) => part.split(',')[1]).filter(Boolean);
  for (const encoded of signatures) {
    try {
      const valid = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0)), signedContent);
      if (valid) return true;
    } catch {
      // Ignore malformed signature candidates and reject below.
    }
  }
  return false;
}

export async function onRequestPost(context) {
  const rawBody = await context.request.text();
  if (!context.env.DODO_WEBHOOK_SECRET) return json({ error: 'Dodo webhook is not configured.' }, 503);
  if (!(await verifyStandardWebhook(context.request, rawBody, context.env.DODO_WEBHOOK_SECRET))) {
    return json({ error: 'Invalid webhook signature.' }, 401);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON payload.' }, 400);
  }

  const eventType = event.type || event.event_type || event.name || '';
  const data = event.data || event.payload || event;
  const metadata = data.metadata || data.custom_data || {};
  const auditId = metadata.auditId || metadata.audit_id || data.auditId || data.audit_id;
  const paymentId = data.payment_id || data.paymentId || data.id;
  const successEvents = ['payment.succeeded', 'payment.completed', 'payment_success'];
  if (!successEvents.includes(eventType)) return json({ received: true, ignored: true, eventType });
  if (!auditId) return json({ error: 'Successful payment is missing audit metadata.' }, 400);
  if (!context.env.CONVEX_AUDIT_URL) return json({ error: 'Convex persistence is not configured.' }, 503);

  const convexResponse = await fetch(context.env.CONVEX_AUDIT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      operation: 'markAuditPaid',
      audit: { auditId, paymentId, provider: 'dodo', status: 'paid', rawEvent: event },
    }),
  });
  if (!convexResponse.ok) return json({ error: 'Convex payment update failed.' }, 502);
  return json({ received: true, auditId, paymentId });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed.' }, 405);
}

export default { onRequest };
