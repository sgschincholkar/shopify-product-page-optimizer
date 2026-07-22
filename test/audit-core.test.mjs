import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCompetitorQueries,
  extractPdpContext,
  filterCompetitorResults,
  normalizeHermesResult,
  runAudit,
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
