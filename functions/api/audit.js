import { auditRequest, validateAuditInput } from '../../src/audit-core.js';

async function streamProxy(context) {
  const rawBody = await context.request.text();
  try {
    validateAuditInput(JSON.parse(rawBody));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid audit payload.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const upstreamUrl = context.env.HERMES_AUDIT_URL || context.env.HERMES_UPSTREAM_URL;
  if (!upstreamUrl) {
    return new Response(JSON.stringify({ error: 'No Hermes upstream configured.' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/x-ndjson',
        ...(context.env.HERMES_UPSTREAM_TOKEN
          ? { authorization: `Bearer ${context.env.HERMES_UPSTREAM_TOKEN}` }
          : {}),
      },
      body: rawBody,
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Hermes upstream is unavailable.' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!upstream.ok) {
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'application/x-ndjson',
      'cache-control': 'no-cache',
    },
  });
}

export async function onRequestPost(context) {
  const accept = context.request.headers.get('accept') || '';
  if (accept.includes('application/x-ndjson') && (context.env.HERMES_AUDIT_URL || context.env.HERMES_UPSTREAM_URL)) {
    return streamProxy(context);
  }
  return auditRequest(context.request, context.env);
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
    status: 405,
    headers: { 'content-type': 'application/json' },
  });
}

export default { onRequest };
