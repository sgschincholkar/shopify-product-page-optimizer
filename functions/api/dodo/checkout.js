function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function dodoBaseUrl(environment = '', configuredBaseUrl = '') {
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '');
  return /test|sandbox/i.test(environment) ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
}

export async function onRequestPost(context) {
  const { DODO_API_KEY: apiKey, DODO_PRODUCT_ID: productId, DODO_ENVIRONMENT: environment, DODO_BASE_URL: configuredBaseUrl, PUBLIC_APP_URL, APP_URL } = context.env;
  if (!apiKey || !productId) return json({ error: 'Dodo checkout is not configured.' }, 503);

  let body;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON payload.' }, 400); }
  const auditId = String(body.auditId || body.audit_id || '').trim();
  const email = String(body.email || '').trim();
  if (!auditId || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'A valid audit ID and email are required.' }, 400);

  const returnUrl = `${(PUBLIC_APP_URL || APP_URL || '').replace(/\/$/, '')}/?payment=success&auditId=${encodeURIComponent(auditId)}`;
  const response = await fetch(`${dodoBaseUrl(environment, configuredBaseUrl)}/checkouts`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email },
      metadata: { auditId, product: 'shopify-product-page-audit' },
      return_url: returnUrl,
    }),
  });

  if (!response.ok) {
    // Keep provider details server-side; return only a safe client error.
    return json({ error: 'Dodo could not create checkout. Try again.' }, 502);
  }
  const payload = await response.json();
  const checkoutUrl = payload.checkout_url || payload.checkoutUrl || payload.url;
  if (!checkoutUrl) return json({ error: 'Dodo returned no checkout URL.' }, 502);
  return json({ checkoutUrl, auditId });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed.' }, 405);
}

export default { onRequest };
