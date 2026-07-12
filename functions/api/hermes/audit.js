import { createFreeTitle, createFullPack, extractPdpContext, extractPageTitle, validateAuditInput } from '../../../src/audit-core.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function linkupCompetitors(input, apiKey) {
  const productPage = await fetchWithTimeout(input.productUrl, {
    headers: { 'user-agent': 'PDP-Signal-Audit/1.0' },
  });
  if (!productPage.ok) throw new Error('The product page could not be loaded.');
  const html = await productPage.text();
  const pdpContext = extractPdpContext(html, input.productUrl);
  const originalTitle = pdpContext.title;
  const query = `${originalTitle} ${input.verticalHint || ''} product page competitors Shopify`.trim();
  const linkupResponse = await fetchWithTimeout('https://api.linkup.so/v1/search', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ q: query, depth: 'standard', outputType: 'searchResults' }),
  }, 30_000);
  if (!linkupResponse.ok) throw new Error(`Linkup returned HTTP ${linkupResponse.status}.`);
  const payload = await linkupResponse.json();
  const origin = new URL(input.productUrl).hostname.replace(/^www\./, '').toLowerCase();
  const competitors = (Array.isArray(payload.results) ? payload.results : [])
    .map((item) => ({
      title: clean(item.name || item.title || ''),
      url: clean(item.url || item.link || ''),
      snippet: clean(item.content || item.snippet || item.description || '').slice(0, 500),
    }))
    .filter((item) => {
      try {
        const hostname = new URL(item.url).hostname.replace(/^www\./, '').toLowerCase();
        return item.url && hostname && hostname !== origin;
      } catch {
        return false;
      }
    })
    .slice(0, 5);
  return { originalTitle, pdpContext, competitors };
}

async function linkupAudit(body, apiKey) {
  const input = validateAuditInput(body);
  const { originalTitle, pdpContext, competitors } = await linkupCompetitors(input, apiKey);
  return {
    auditId: crypto.randomUUID(),
    productUrl: input.productUrl,
    originalTitle,
    pdpContext,
    newTitle: createFreeTitle(originalTitle),
    competitors,
    fullPack: createFullPack(originalTitle, competitors),
    source: 'linkup-benchmarked-fallback',
    note: competitors.length
      ? `Linkup found ${competitors.length} comparable product pages. Title uses the transparent fallback generator until HERMES_UPSTREAM_URL is configured.`
      : 'Linkup returned no usable competitor pages. Title uses the transparent fallback generator.',
  };
}

export async function onRequestPost(context) {
  if (context.env.HERMES_UPSTREAM_URL) {
    const rawBody = await context.request.text();
    let upstreamBody = rawBody;
    try {
      const input = validateAuditInput(JSON.parse(rawBody));
      if (context.env.LINKUP_API_KEY) {
        try {
          const benchmark = await linkupCompetitors(input, context.env.LINKUP_API_KEY);
          upstreamBody = JSON.stringify({ ...input, pdpContext: benchmark.pdpContext, competitors: benchmark.competitors });
        } catch {
          // Hermes can still scrape the URL itself if Linkup is temporarily unavailable.
          upstreamBody = JSON.stringify(input);
        }
      }
    } catch {
      return json({ error: 'Invalid audit payload.' }, 400);
    }
    let upstream;
    try {
      upstream = await fetch(context.env.HERMES_UPSTREAM_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(context.env.HERMES_UPSTREAM_TOKEN ? { authorization: `Bearer ${context.env.HERMES_UPSTREAM_TOKEN}` } : {}),
        },
        body: upstreamBody,
      });
    } catch {
      return json({ error: 'Hermes upstream is unavailable.' }, 502);
    }
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
    });
  }

  if (!context.env.LINKUP_API_KEY) return json({ error: 'Neither Hermes upstream nor Linkup is configured.' }, 503);
  try {
    return json(await linkupAudit(await context.request.json(), context.env.LINKUP_API_KEY));
  } catch (error) {
    return json({ error: error.message || 'Linkup audit failed.' }, 400);
  }
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed.' }, 405);
}

export default { onRequest };
