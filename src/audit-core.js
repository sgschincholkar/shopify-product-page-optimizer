const TITLE_LIMIT = 180;
const AUDIT_TIMEOUT_MS = 85_000;

export function validateAuditInput(body = {}) {
  const email = String(body.email || body.user_email || '').trim();
  const productUrl = String(body.productUrl || body.product_url || '').trim();
  const verticalHint = String(body.verticalHint || body.vertical_hint || '').trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
  let parsed;
  try { parsed = new URL(productUrl); } catch { throw new Error('Enter a valid product page URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('The product URL must start with http:// or https://.');
  return { email, productUrl: parsed.toString(), ...(verticalHint ? { verticalHint } : {}) };
}

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export function extractPageTitle(html = '') {
  const candidates = [
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1],
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1],
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1],
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
  ];
  const title = cleanText(candidates.find(Boolean) || '');
  if (!title) throw new Error('We could not find a product title on that page.');
  return title.slice(0, TITLE_LIMIT);
}

function stripBrandSuffix(title) {
  return title.replace(/\s*[|–—-]\s*[^|–—-]{2,40}$/u, '').trim();
}

export function extractPdpContext(html = '', productUrl = '') {
  const text = (value = '') => cleanText(value.replace(/<[^>]+>/g, ' '));
  const meta = (name) => {
    const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i');
    const match = html.match(pattern);
    return cleanText(match?.[1] || match?.[2] || '');
  };
  const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((m) => text(m[1])).filter(Boolean).slice(0, 12);
  const bullets = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => text(m[1])).filter((item) => item.length > 8).slice(0, 12);
  const images = [...html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi)].map((m) => m[1]).filter(Boolean).slice(0, 12);
  const price = html.match(/(?:[$€£]\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:USD|EUR|GBP))/i)?.[0] || '';
  const description = meta('description') || meta('og:description');
  let structuredData = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { structuredData.push(JSON.parse(match[1])); } catch { /* malformed JSON-LD is ignored */ }
  }
  return {
    url: productUrl,
    title: extractPageTitle(html),
    description: description.slice(0, 1200),
    price: cleanText(price).slice(0, 80),
    headings,
    bullets,
    images,
    structuredData: structuredData.slice(0, 5),
  };
}

export function createFreeTitle(originalTitle) {
  const base = stripBrandSuffix(originalTitle).replace(/[.!?]+$/g, '').trim();
  if (!base) return originalTitle;
  if (/\b(serum|cleanser|moisturizer|cream|shampoo|oil|supplement|protein|tea|coffee)\b/i.test(base)) {
    return `${base} — Clear benefits, made for everyday use`;
  }
  return `${base} — Thoughtfully made for better everyday results`;
}

export function createFullPack(originalTitle, competitors = []) {
  const base = stripBrandSuffix(originalTitle).replace(/[.!?]+$/g, '').trim();
  const competitorTerms = competitors
    .flatMap((item) => cleanText(item.title || '').split(/[^a-z0-9]+/i))
    .filter((term) => term.length > 4)
    .slice(0, 4);
  const angle = competitorTerms.length ? competitorTerms.join(', ') : 'everyday performance';
  return {
    title: createFreeTitle(originalTitle),
    bullets: [
      `Built around ${base.toLowerCase()} for a clearer, more confident product choice.`,
      'Designed to make the main benefit easy to understand at a glance.',
      'A simple, practical option for consistent everyday use.',
      `Positioned around ${angle} without unsupported promises.`,
      'Clear product language that helps shoppers decide with less hesitation.',
    ],
    faqs: [
      { question: 'Who is this product for?', answer: `It is designed for shoppers looking for a straightforward option built around ${base.toLowerCase()}.` },
      { question: 'How should I use it?', answer: 'Follow the usage instructions, ingredients, and safety guidance supplied by the brand on the product packaging.' },
      { question: 'When will I notice results?', answer: 'Results vary by product and person. Set expectations using verified product evidence rather than guaranteed outcomes.' },
      { question: 'What should I check before buying?', answer: 'Review the ingredients, specifications, size, compatibility, and any applicable sensitivities before purchase.' },
      { question: 'What makes this different?', answer: `The page should lead with the clearest customer benefit and support it with specific, verifiable product details.` },
    ],
    trustCopy: 'Clear details. Specific benefits. No impossible claims.',
    seo: {
      metaTitle: createFreeTitle(originalTitle).slice(0, 60),
      metaDescription: `Explore ${base.toLowerCase()} with clear benefits, practical details, and confident product guidance.`.slice(0, 155),
      keyTerms: [base, ...competitorTerms].filter(Boolean).slice(0, 8),
    },
    imageRecommendations: [
      'Hero image: product clearly visible with one concise benefit overlay.',
      'Lifestyle image: product shown in its real use context.',
      'Detail image: texture, material, ingredients, or key specification close-up.',
      'Comparison image: simple visual that clarifies fit, size, or use case.',
    ],
  };
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}

export function normalizeHermesResult(payload = {}, input = {}) {
  const originalTitle = cleanText(firstValue(payload.originalTitle, payload.original_title, payload.shopify_original_title));
  const newTitle = cleanText(firstValue(payload.newTitle, payload.new_title, payload.shopify_title));
  if (!originalTitle || !newTitle) throw new Error('The Hermes audit returned an incomplete title result.');
  const competitors = Array.isArray(payload.competitors) ? payload.competitors : [];
  return {
    auditId: firstValue(payload.auditId, payload.audit_id) || crypto.randomUUID(),
    productUrl: input.productUrl,
    originalTitle: originalTitle.slice(0, TITLE_LIMIT),
    newTitle: newTitle.slice(0, TITLE_LIMIT),
    competitors,
    pdpContext: payload.pdpContext || payload.pdp_context || null,
    fullPack: payload.fullPack || payload.full_pack || null,
    source: firstValue(payload.source, payload.auditSource) || 'hermes',
    note: cleanText(payload.note || 'Title generated by the Hermes audit service.'),
  };
}

async function fetchWithTimeout(fetchImpl, url, options = {}, timeoutMs = AUDIT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function persistAudit(fetchImpl, convexAuditUrl, result, input) {
  if (!convexAuditUrl) return { status: 'not_configured' };
  const payload = {
    operation: 'saveFreeAudit',
    audit: {
      auditId: result.auditId,
      productUrl: input.productUrl,
      userEmail: input.email,
      status: result.fullPack ? 'full_pack_ready' : 'free_done',
      originalTitle: result.originalTitle,
      newTitle: result.newTitle,
      competitors: result.competitors,
      fullPackJson: result.fullPack || undefined,
    },
  };
  try {
    const response = await fetchWithTimeout(fetchImpl, convexAuditUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }, 10_000);
    if (!response.ok) return { status: 'failed', error: `Convex returned HTTP ${response.status}.` };
    let savedAudit = null;
    try { savedAudit = await response.json(); } catch { /* status is still useful if the provider omits a body */ }
    return { status: 'saved', audit: savedAudit };
  } catch (error) {
    return { status: 'failed', error: error.name === 'AbortError' ? 'Convex persistence timed out.' : 'Convex persistence failed.' };
  }
}

export async function runAudit(body, { fetchImpl = fetch, hermesAuditUrl = '', convexAuditUrl = '' } = {}) {
  const input = validateAuditInput(body);
  let result;
  if (hermesAuditUrl) {
    let response;
    try {
      response = await fetchWithTimeout(fetchImpl, hermesAuditUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch (error) {
      throw new Error(error.name === 'AbortError' ? 'The audit service timed out. Try again.' : 'The audit service is unavailable. Try again.');
    }
    if (!response.ok) throw new Error('The audit service is temporarily unavailable.');
    let payload;
    try { payload = await response.json(); } catch { throw new Error('The audit service returned invalid JSON.'); }
    result = normalizeHermesResult(payload, input);
  } else {
    let response;
    try {
      response = await fetchWithTimeout(fetchImpl, input.productUrl, { headers: { 'user-agent': 'PDP-Signal-Audit/1.0' } });
    } catch {
      throw new Error('We could not reach that product page. Check the URL and try again.');
    }
    if (!response.ok) throw new Error('That product page could not be loaded. Check the URL and try again.');
    const html = await response.text();
    const pdpContext = extractPdpContext(html, input.productUrl);
    const originalTitle = pdpContext.title;
    result = {
      auditId: crypto.randomUUID(),
      productUrl: input.productUrl,
      originalTitle,
      pdpContext,
      newTitle: createFreeTitle(originalTitle),
      competitors: [],
      fullPack: createFullPack(originalTitle, []),
      source: 'page-title-fallback',
      note: 'Fallback title only. Configure HERMES_AUDIT_URL for competitor-benchmarked generation.',
    };
  }
  const persistence = await persistAudit(fetchImpl, convexAuditUrl, result, input);
  const stored = persistence.audit;
  return {
    ...result,
    ...(stored?.originalTitle ? { originalTitle: stored.originalTitle } : {}),
    ...(stored?.newTitle ? { newTitle: stored.newTitle } : {}),
    ...(stored?.fullPackJson ? { fullPack: stored.fullPackJson } : {}),
    ...(Array.isArray(stored?.competitors) ? { competitors: stored.competitors } : {}),
    persistence,
  };
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

export async function auditRequest(request, env = {}) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);
  try {
    const body = await request.json();
    return jsonResponse(await runAudit(body, { hermesAuditUrl: env.HERMES_AUDIT_URL, convexAuditUrl: env.CONVEX_AUDIT_URL }));
  } catch (error) {
    return jsonResponse({ error: error.message || 'Audit failed. Try again.' }, 400);
  }
}

export { TITLE_LIMIT };

export function auditRequestForNode(req, res, env = {}) {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', async () => {
    try {
      const result = await runAudit(JSON.parse(raw || '{}'), { hermesAuditUrl: env.HERMES_AUDIT_URL, convexAuditUrl: env.CONVEX_AUDIT_URL });
      res.statusCode = 200; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(result));
    } catch (error) {
      res.statusCode = 400; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ error: error.message || 'Audit failed. Try again.' }));
    }
  });
}
