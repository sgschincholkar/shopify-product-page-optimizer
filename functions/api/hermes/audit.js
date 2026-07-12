function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost(context) {
  if (!context.env.HERMES_UPSTREAM_URL) {
    return json({ error: 'Hermes upstream audit service is not configured.' }, 503);
  }
  const body = await context.request.text();
  let upstream;
  try {
    upstream = await fetch(context.env.HERMES_UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(context.env.HERMES_UPSTREAM_TOKEN ? { authorization: `Bearer ${context.env.HERMES_UPSTREAM_TOKEN}` } : {}),
      },
      body,
    });
  } catch {
    return json({ error: 'Hermes upstream is unavailable.' }, 502);
  }
  const responseBody = await upstream.text();
  return new Response(responseBody, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed.' }, 405);
}

export default { onRequest };
