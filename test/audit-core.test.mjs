import assert from 'node:assert/strict';
import test from 'node:test';

import { Readable } from 'node:stream';

import {
  buildCompetitorQueries,
  extractPdpContext,
  filterCompetitorResults,
  normalizeHermesResult,
  parseNdjsonStream,
  runAudit,
  scoreAudit,
  scoreSection,
  SECTION_DEFINITIONS,
  STREAM_EVENTS,
} from '../src/audit-core.js';

const coffeePdpHtml = `
  <html>
    <head>
      <meta property="og:title" content="Fiercely Strong Coffee | Dark Roast Coffee" />
      <meta name="description" content="A bold dark roast coffee with smooth flavor and high caffeine for early mornings." />
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Fiercely Strong Coffee","brand":{"@type":"Brand","name":"Death Wish Coffee"},"category":"Dark Roast Coffee","description":"A bold dark roast coffee with smooth flavor and high caffeine."}
      </script>
    </head>
    <body><h1>Fiercely Strong Coffee</h1><h2>Bold dark roast flavor</h2></body>
  </html>`;

test('extracts brand, product type, and search terms from PDP evidence', () => {
  const context = extractPdpContext(coffeePdpHtml, 'https://www.deathwishcoffee.com/products/death-wish-coffee');

  assert.equal(context.brand, 'Death Wish Coffee');
  assert.equal(context.productType, 'Dark Roast Coffee');
  assert.ok(context.searchTerms.includes('dark roast coffee'));
  assert.ok(context.searchTerms.includes('high caffeine'));
});

test('infers product type from title when structured category is missing and ignores UI headings', () => {
  const context = extractPdpContext(`
    <meta property="og:title" content="Fiercely Strong Coffee | Dark Roast Coffee" />
    <meta name="description" content="Bold flavor and high caffeine for early mornings." />
    <h1>Fiercely Strong Coffee</h1><h2>Item added to your cart</h2><h2>Bold flavor</h2>
  `, 'https://www.deathwishcoffee.com/products/death-wish-coffee');

  assert.equal(context.productType, 'Dark Roast Coffee');
  assert.ok(!context.searchTerms.some((term) => /item added|cart/i.test(term)));
});

test('builds category-led competitor queries and excludes merchant brand results', () => {
  const context = extractPdpContext(coffeePdpHtml, 'https://www.deathwishcoffee.com/products/death-wish-coffee');
  const queries = buildCompetitorQueries(context, {});

  assert.ok(queries.length >= 2);
  assert.ok(queries.every((query) => !/death wish/i.test(query)));
  assert.ok(queries.some((query) => /dark roast coffee/i.test(query)));

  const results = filterCompetitorResults([
    { title: 'Death Wish Coffee Dark Roast', url: 'https://www.deathwishcoffee.com/products/other', snippet: '', query: queries[0] },
    { title: 'Fierce Dark Roast Coffee', url: 'https://ironbeancoffee.com/products/fierce', snippet: '', query: queries[0] },
  ], context, 'https://www.deathwishcoffee.com/products/death-wish-coffee');

  assert.deepEqual(results.map((item) => item.url), ['https://ironbeancoffee.com/products/fierce']);
  assert.equal(results[0].query, queries[0]);
});

test('normalizes Hermes proof fields without dropping the evidence layer', () => {
  const result = normalizeHermesResult({
    originalTitle: 'Original PDP Title',
    newTitle: 'Improved PDP Title',
    fullPack: { title: 'Improved PDP Title', bullets: [] },
    competitors: [{ title: 'Competitor', url: 'https://example.com/products/item' }],
    discoveryQueries: ['dark roast coffee competitors'],
    competitorGaps: [{ gap: 'Missing proof', evidenceIds: ['m-1'] }],
    evidence: [{ id: 'm-1', sourceType: 'merchant-pdp', observation: 'Merchant proof.' }],
    claimWarnings: [{ proposedClaim: 'Best ever', reason: 'Unsupported.' }],
    limitations: ['Only one competitor PDP was available.'],
    analysisMode: 'limited-competitor',
  }, { productUrl: 'https://merchant.com/products/item' });

  assert.deepEqual(result.competitorGaps, [{ gap: 'Missing proof', evidenceIds: ['m-1'] }]);
  assert.deepEqual(result.evidence, [{ id: 'm-1', sourceType: 'merchant-pdp', observation: 'Merchant proof.' }]);
  assert.deepEqual(result.claimWarnings, [{ proposedClaim: 'Best ever', reason: 'Unsupported.' }]);
  assert.deepEqual(result.limitations, ['Only one competitor PDP was available.']);
  assert.equal(result.analysisMode, 'limited-competitor');
  assert.deepEqual(result.discoveryQueries, ['dark roast coffee competitors']);
});

test('persists Hermes proof fields with the audit record', async () => {
  let convexPayload;
  const fetchImpl = async (url, options = {}) => {
    if (url === 'https://hermes.local/audit') {
      return new Response(JSON.stringify({
        originalTitle: 'Original PDP Title',
        newTitle: 'Improved PDP Title',
        fullPack: { title: 'Improved PDP Title', bullets: [] },
        competitors: [],
        discoveryQueries: ['dark roast coffee competitors', 'dark roast coffee product page'],
        competitorGaps: [{ gap: 'Weak trust proof', evidenceIds: ['m-1'] }],
        evidence: [{ id: 'm-1', sourceType: 'merchant-pdp', observation: 'No trust marker found.' }],
        claimWarnings: [{ proposedClaim: 'Certified', reason: 'No certificate supplied.' }],
        limitations: ['No rendered reviews available.'],
        analysisMode: 'merchant-only-fallback',
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url === 'https://convex.local/api/audit') {
      convexPayload = JSON.parse(options.body);
      return new Response(JSON.stringify({ status: 'full_pack_ready' }), { status: 200 });
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  await runAudit(
    { productUrl: 'https://merchant.com/products/item', email: 'founder@example.com' },
    { fetchImpl, hermesAuditUrl: 'https://hermes.local/audit', convexAuditUrl: 'https://convex.local/api/audit' },
  );

  assert.deepEqual(convexPayload.audit.competitorGaps, [{ gap: 'Weak trust proof', evidenceIds: ['m-1'] }]);
  assert.deepEqual(convexPayload.audit.evidence, [{ id: 'm-1', sourceType: 'merchant-pdp', observation: 'No trust marker found.' }]);
  assert.deepEqual(convexPayload.audit.claimWarnings, [{ proposedClaim: 'Certified', reason: 'No certificate supplied.' }]);
  assert.deepEqual(convexPayload.audit.limitations, ['No rendered reviews available.']);
  assert.equal(convexPayload.audit.analysisMode, 'merchant-only-fallback');
  assert.deepEqual(convexPayload.audit.discoveryQueries, ['dark roast coffee competitors', 'dark roast coffee product page']);
});

test('scoreSection starts at 100 and stays there with no gaps, warnings, or missing content', () => {
  const section = SECTION_DEFINITIONS.find((item) => item.id === 'trust');
  const result = scoreSection(section, { competitorGaps: [], claimWarnings: [], pack: { trustCopy: 'Backed by a 30-day guarantee.' } });

  assert.equal(result.score, 100);
  assert.equal(result.band, 'good');
  assert.equal(result.missingContent, false);
});

test('scoreSection penalizes a matching high-impact gap and bands it accordingly', () => {
  const section = SECTION_DEFINITIONS.find((item) => item.id === 'trust');
  const result = scoreSection(section, {
    competitorGaps: [{ gap: 'Weak trust proof', impact: 'high', recommendation: 'Add a guarantee badge.' }],
    claimWarnings: [],
    pack: { trustCopy: 'Backed by a 30-day guarantee.' },
  });

  assert.equal(result.score, 78);
  assert.equal(result.band, 'warn');
  assert.equal(result.gaps.length, 1);
});

test('scoreSection ignores gaps that do not mention this section', () => {
  const section = SECTION_DEFINITIONS.find((item) => item.id === 'seo');
  const result = scoreSection(section, {
    competitorGaps: [{ gap: 'Weak trust proof', impact: 'high' }],
    claimWarnings: [],
    pack: { seo: { metaTitle: 'Dark Roast Coffee | Brand', metaDescription: 'Bold and smooth.' } },
  });

  assert.equal(result.score, 100);
  assert.equal(result.gaps.length, 0);
});

test('scoreSection applies a large penalty and missingContent flag when the section has no generated content', () => {
  const section = SECTION_DEFINITIONS.find((item) => item.id === 'benefits');
  const result = scoreSection(section, { competitorGaps: [], claimWarnings: [], pack: {} });

  assert.equal(result.score, 70);
  assert.equal(result.band, 'warn');
  assert.equal(result.missingContent, true);
});

test('scoreSection clamps at zero under heavy penalties', () => {
  const section = SECTION_DEFINITIONS.find((item) => item.id === 'faqs');
  const result = scoreSection(section, {
    competitorGaps: [
      { gap: 'FAQ missing objection handling', impact: 'high' },
      { gap: 'FAQ tone is generic', impact: 'high' },
      { gap: 'FAQ ignores common question', impact: 'high' },
    ],
    claimWarnings: [{ proposedClaim: 'FAQ overclaims results', reason: 'No proof supplied.' }],
    pack: {},
  });

  assert.equal(result.score, 0);
  assert.equal(result.band, 'critical');
});

test('scoreAudit scores every defined section and averages them into an overall band', () => {
  const result = scoreAudit({
    newTitle: 'Fiercely Strong Dark Roast Coffee',
    fullPack: {
      description: 'A bold dark roast built for early mornings.',
      bullets: ['High caffeine', 'Smooth finish'],
      faqs: [{ question: 'Is it strong?', answer: 'Yes.' }],
      trustCopy: 'Loved by thousands of early risers.',
      imageRecommendations: ['Show the roast color close up.'],
      seo: { metaTitle: 'Dark Roast Coffee', metaDescription: 'Bold and smooth.', keyTerms: ['dark roast'] },
    },
    competitorGaps: [{ gap: 'Weak trust proof', impact: 'medium' }],
    claimWarnings: [],
  });

  assert.equal(result.sections.length, SECTION_DEFINITIONS.length);
  assert.equal(result.gapCount, 1);
  assert.equal(result.method, 'heuristic');
  assert.ok(result.overall < 100 && result.overall >= 80);
  assert.equal(result.band, 'good');
});

test('scoreAudit returns zero-content penalties for every section on an empty fallback pack', () => {
  const result = scoreAudit({ newTitle: '', fullPack: null, competitorGaps: [], claimWarnings: [] });

  assert.ok(result.sections.every((section) => section.missingContent));
  assert.equal(result.overall, 70);
  assert.equal(result.band, 'warn');
});

test('STREAM_EVENTS exports all expected event names', () => {
  assert.equal(STREAM_EVENTS.AUDIT_STARTED, 'audit_started');
  assert.equal(STREAM_EVENTS.PDP_SCRAPED, 'pdp_scraped');
  assert.equal(STREAM_EVENTS.COMPETITORS_FOUND, 'competitors_found');
  assert.equal(STREAM_EVENTS.HERMES_COMPLETE, 'hermes_complete');
  assert.equal(STREAM_EVENTS.FATAL_ERROR, 'fatal_error');
  assert.equal(STREAM_EVENTS.KEEPALIVE, 'keepalive');
});

function ndjsonStream(lines) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + '\n'));
      }
      controller.close();
    },
  });
}

test('parseNdjsonStream yields parsed objects from complete lines', async () => {
  const stream = ndjsonStream([
    JSON.stringify({ event: 'audit_started', data: { auditId: 'abc' } }),
    JSON.stringify({ event: 'pdp_scraped', data: { originalTitle: 'Test' } }),
  ]);
  const events = [];
  for await (const event of parseNdjsonStream(stream)) {
    events.push(event);
  }
  assert.equal(events.length, 2);
  assert.equal(events[0].event, 'audit_started');
  assert.equal(events[0].data.auditId, 'abc');
  assert.equal(events[1].event, 'pdp_scraped');
});

test('parseNdjsonStream handles partial chunks split across reads', async () => {
  const line1 = JSON.stringify({ event: 'audit_started', data: { id: '1' } });
  const line2 = JSON.stringify({ event: 'pdp_scraped', data: { id: '2' } });
  const full = line1 + '\n' + line2 + '\n';
  const mid = Math.floor(full.length / 2);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(full.slice(0, mid)));
      controller.enqueue(encoder.encode(full.slice(mid)));
      controller.close();
    },
  });
  const events = [];
  for await (const event of parseNdjsonStream(stream)) {
    events.push(event);
  }
  assert.equal(events.length, 2);
  assert.equal(events[0].data.id, '1');
  assert.equal(events[1].data.id, '2');
});

test('parseNdjsonStream skips empty lines', async () => {
  const stream = ndjsonStream([
    JSON.stringify({ event: 'keepalive', data: {} }),
    '',
    '  ',
    JSON.stringify({ event: 'hermes_complete', data: { done: true } }),
  ]);
  const events = [];
  for await (const event of parseNdjsonStream(stream)) {
    events.push(event);
  }
  assert.equal(events.length, 2);
  assert.equal(events[0].event, 'keepalive');
  assert.equal(events[1].event, 'hermes_complete');
});
