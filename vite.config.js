import { defineConfig, loadEnv } from 'vite';
import { auditRequestForNode, createFreeTitle, createFullPack } from './src/audit-core.js';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function emitNdjson(res, event, data) {
  res.write(JSON.stringify({ event, data }) + '\n');
}

function handleMockStream(req, res) {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', async () => {
    let body;
    try { body = JSON.parse(raw); } catch { res.statusCode = 400; return res.end('{"error":"Bad JSON"}'); }

    res.writeHead(200, {
      'content-type': 'application/x-ndjson',
      'cache-control': 'no-cache',
      'transfer-encoding': 'chunked',
    });

    const auditId = crypto.randomUUID();
    const productUrl = body.productUrl || 'https://example.com/products/test';
    const originalTitle = 'Fiercely Strong Dark Roast Coffee | Death Wish Coffee';

    emitNdjson(res, 'audit_started', { auditId, productUrl, ts: Date.now() });
    await sleep(1500);

    const freePack = createFullPack(originalTitle, []);
    emitNdjson(res, 'pdp_scraped', {
      originalTitle,
      pdpContext: { url: productUrl, title: originalTitle, brand: 'Death Wish Coffee', productType: 'Dark Roast Coffee', searchTerms: ['dark roast coffee', 'high caffeine'] },
      freePack,
    });
    await sleep(3000);

    const competitors = [
      { title: 'Iron Bean Dark Roast', url: 'https://ironbeancoffee.com/products/dark-roast', snippet: 'Bold and smooth dark roast.' },
      { title: 'Black Rifle Coffee', url: 'https://blackriflecoffee.com/products/beyond-black', snippet: 'Extra strong dark roast blend.' },
    ];
    const enrichedPack = createFullPack(originalTitle, competitors);
    emitNdjson(res, 'competitors_found', {
      competitors,
      discoveryQueries: ['dark roast coffee competitors', 'dark roast coffee Shopify product page'],
      enrichedPack,
    });
    await sleep(4000);

    emitNdjson(res, 'hermes_complete', {
      auditId,
      newTitle: 'Fiercely Strong Dark Roast — Bold flavor, high caffeine, built for early mornings',
      fullPack: {
        description: 'A bold dark roast built for mornings that demand more. Smooth enough to drink black, strong enough to replace your alarm clock.',
        bullets: [
          'High caffeine without the bitterness of traditional dark roasts.',
          'Smooth finish that works black or with milk.',
          'Small-batch roasted for consistent quality.',
          'USDA Certified Organic and Fair Trade.',
          'Bold flavor designed for those who take their mornings seriously.',
        ],
        faqs: [
          { question: 'How much caffeine does it have?', answer: 'Roughly 300mg per 12oz cup — about twice the average dark roast.' },
          { question: 'Is it too bitter for light roast drinkers?', answer: 'No. The roast profile is smooth with low acidity, so light-roast fans still enjoy it.' },
          { question: 'How should I brew it?', answer: 'French press or pour-over for the best flavor extraction. Works well in drip machines too.' },
        ],
        trustCopy: 'Loved by thousands. USDA Organic. Fair Trade certified. 60-day money-back guarantee.',
        imageRecommendations: [
          'Hero image: bag with beans visible, morning-light backdrop.',
          'Lifestyle image: person brewing the coffee in a real kitchen.',
          'Detail image: close-up of the whole beans showing roast color.',
          'Comparison image: side-by-side color difference vs medium roast.',
        ],
        seo: {
          metaTitle: 'Fiercely Strong Dark Roast Coffee — Bold & Smooth | Death Wish Coffee',
          metaDescription: 'Bold dark roast with twice the caffeine, smooth enough to drink black. USDA Organic, Fair Trade. Free shipping over $35.',
          keyTerms: ['dark roast coffee', 'high caffeine coffee', 'strong coffee', 'bold dark roast'],
        },
      },
      competitorGaps: [
        { gap: 'Weak trust proof — no guarantee mentioned', impact: 'high', recommendation: 'Add a visible money-back guarantee badge.' },
        { gap: 'Missing FAQ section', impact: 'medium', recommendation: 'Add 3-5 FAQs addressing common objections.' },
      ],
      evidence: [
        { id: 'c-1', sourceType: 'competitor-pdp', observation: 'Iron Bean shows a 90-day guarantee badge prominently.' },
        { id: 'c-2', sourceType: 'competitor-pdp', observation: 'Black Rifle has a 10-question FAQ section.' },
      ],
      claimWarnings: [
        { proposedClaim: 'Twice the caffeine', reason: 'Requires lab test documentation to support.' },
      ],
      limitations: ['Only 2 competitor pages were available for comparison.'],
      analysisMode: 'limited-competitor',
    });

    emitNdjson(res, 'audit_persisted', { persistence: { status: 'saved' } });
    res.end();
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const mockStream = env.MOCK_STREAM === '1' || process.env.MOCK_STREAM === '1';
  return {
    plugins: [{
      name: 'local-audit-api',
      configureServer(server) {
        server.middlewares.use('/api/audit', (req, res) => {
          if (mockStream && (req.headers.accept || '').includes('application/x-ndjson')) {
            return handleMockStream(req, res);
          }
          auditRequestForNode(req, res, env);
        });
      },
    }],
  };
});
