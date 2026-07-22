# Shopify Product Page Optimizer — V1 Build

## Source of truth

- PRD: `PRD - Shopify Product Page Optimizer.md`
- Project rules: `AGENTS.md`
- Global rules: `/Users/sgschincholkar/.claude/CLAUDE.md`
- Workspace: `/Users/sgschincholkar/shopify-product-page-optimizer`

## Stack

- Frontend: Vite static app, deployable to Cloudflare Pages
- API: Cloudflare Pages Functions under `functions/api/`
- Audit execution: Hermes audit agent/server
- Storage: Convex audit persistence
- Payments: Dodo one-time checkout, $19 per audit, v2 only
- Email: backend-triggered full-pack delivery, v2 only

## Status

### Value proposition rollout

- [x] Apply approved headline: `Find the gaps in your Shopify product page. Get the copy to fix them.`
- [x] Explain the 3-5 competitor comparison and SEO, conversion, trust, and buyer-objection analysis
- [x] Use `Analyze my product page` as the primary CTA
- [x] Align PRD, README, agent instructions, metadata, and project memory
- [x] Build and check active files for stale primary positioning

### Hermes skill — Shopify PDP upgrade audit

- [x] Create a version-controlled `shopify-pdp-upgrade-audit` Hermes skill
- [x] Adapt PDP-relevant rules from global `seo-audit`, `page-cro`, and `copywriting` skills
- [x] Define competitor evidence, claim-safety, fallback, and strict JSON output rules
- [x] Add and run structural validation for the skill contract
- [x] Install the skill into the active Hermes profile
- [x] Update the Hermes adapter to preload the skill explicitly
- [x] Exercise Hermes with the installed skill and record the actual result

### CEO review — v1 wedge decision

- [x] Re-evaluate the offer with `plan-ceo-review` in scope-reduction mode
- [x] Confirm the wedge is not "competitor benchmarking only"; the wedge is a paste-ready PDP upgrade pack backed by competitor evidence
- [x] Keep SEO metadata, keywords, description, bullets, FAQs, and trust/objection fixes in the paid deliverable because competitors already offer SEO/copy outputs
- [x] Treat competitor benchmarking as the proof layer and differentiator, not the only output

### Tight v1 spec — prove the payment-free product loop

Positioning:

> Find the gaps in your Shopify product page. Get the copy to fix them.

Supporting copy:

> We compare your page with 3-5 relevant competitors, uncover SEO, conversion, trust, and buyer-objection gaps, then rewrite your title, description, benefits, FAQs, and metadata.

Free preview:

- [ ] User submits email and one public Shopify product URL
- [ ] App extracts the current PDP title and core page context
- [ ] App discovers 3-5 relevant competitor PDPs when configured tools are available
- [ ] App shows original title, upgraded title, and 2-3 competitor-backed gaps
- [ ] If competitor discovery fails, app still returns a title and clearly labels the fallback condition

Full pack shown in v1:

- [ ] Improved Shopify product title
- [ ] Conversion-focused product description
- [ ] 5-7 benefits-first bullets
- [ ] SEO meta title and meta description
- [ ] 5-10 FAQs based on likely buyer objections
- [ ] 5-10 keyword/search phrases
- [ ] Evidence-backed trust and objection fixes
- [ ] Image suggestions derived from competitor norms
- [ ] Legal-supportability disclaimer for every suggested claim or trust marker
- [ ] Copy-paste-ready Shopify blocks

V2 only:

- [ ] Dodo $19 checkout and paid access
- [ ] Signed payment webhook and payment records
- [ ] Email delivery after payment

Do not build in v1:

- [ ] No bulk catalog optimization
- [ ] No Shopify app install or admin permission flow
- [ ] No one-click publishing
- [ ] No dashboard unless needed for internal verification
- [ ] No repeat-user brand memory before the core audit path works

Proof target:

- [x] Run a real Shopify PDP through live Hermes/Linkup/Convex locally
- [x] Preserve Hermes proof fields (`competitorGaps`, `evidence`, `claimWarnings`, `limitations`) through API normalization and persistence
- [x] Render competitor gaps, claim warnings, and limitations in the payment-free result screen
- [x] Verify the full pack is generated and rendered from a real payment-free audit
- [x] Record what was live, fallback, simulated, or blocked in this file after verification

### Market research — live competitors

- [x] Find tools already in market that overlap with PDP title/copy/SEO optimization for Shopify merchants
- [x] Separate direct competitors from adjacent AI copy, SEO, and CRO tools
- [x] Note positioning gaps we can use for Shopify Product Page Optimizer

### Completed

- [x] Initial Cloudflare Pages-compatible landing page
- [x] Email and Shopify URL form
- [x] Processing state
- [x] Free-title comparison UI
- [x] Input validation and recoverable error UI
- [x] Fallback PDP title extraction and heuristic title generation
- [x] Explicit Hermes audit API seam
- [x] Cloudflare Pages function adapter at `functions/api/audit.js`
- [x] Project-specific `AGENTS.md`

### Critical slice — current build

- [x] Finalize the structured audit request/response contract
- [x] Connect `HERMES_AUDIT_URL` as the Hermes free-audit seam
- [x] Normalize and validate Hermes output
- [x] Connect `CONVEX_AUDIT_URL` as the audit persistence seam
- [x] Expose live/fallback source and persistence status in the frontend result
- [x] Verify local request → Hermes → Convex → result with real credentials

### Competitor discovery quality improvement — July 23, 2026

- [x] Keep the customer flow limited to product URL and email
- [x] Extract brand and product category from PDP structured data and metadata
- [x] Infer useful category and buyer-language search terms from the PDP
- [x] Generate multiple category-led Linkup queries instead of title-only discovery
- [x] Exclude merchant hostname and obvious merchant-brand results
- [x] Preserve query provenance in the audit response and Convex record
- [x] Render the exact competitor searches used in the result proof layer
- [x] Test and build the improved discovery path
- [ ] Re-run the production Cloudflare path after deployment configuration

### Remaining full build

- [x] Add Convex audit persistence; payment records remain v2
- [x] Provision a Convex development deployment and HTTP action
- [x] Verify Convex `/api/audit` OPTIONS response with HTTP 200
- [x] Extract complete PDP context: description, bullets, price, reviews, images
- [x] Discover and extract up to 5 relevant competitor PDPs through Linkup
- [x] Add fallback behavior when competitor discovery fails
- [x] Pass structured PDP context and competitor evidence to Hermes upstream
- [x] Generate a payment-free development full pack: title, bullets, FAQs, trust copy, SEO, and image recommendations
- [x] Render the full pack in the browser result state
- [x] Analyze positioning, claims, objections, pricing, and keyword patterns with Hermes on a real PDP locally
- [x] Generate structured free title output through Hermes
- [ ] V2: Add Convex payment records and paid audit state
- [ ] V2: Add Dodo server-side checkout creation with audit metadata
- [ ] V2: Add frontend checkout handoff and recoverable error state
- [ ] V2: Verify a real Dodo test checkout
- [ ] V2: Add signed, idempotent Dodo webhook
- [ ] V2: Mark audits paid and persist payment records in Convex
- [x] Generate and persist the full upgrade pack in the payment-free development path
- [x] Add payment-free full-pack screen
- [x] Return the Convex-stored title, competitors, and full pack in the audit response
- [ ] V2: Add email delivery after payment
- [ ] Deploy to Cloudflare Pages and configure v1 production secrets
- [ ] Run production end-to-end demo on a public Shopify PDP
- [x] Run local real end-to-end demo on a public Shopify PDP
- [ ] V2: Verify Dodo dashboard shows a live payment

## Critical slice contract

### Frontend/API request

```json
{
  "productUrl": "https://store.com/products/item",
  "email": "founder@brand.com",
  "verticalHint": "skincare"
}
```

### Hermes response minimum

```json
{
  "auditId": "optional-existing-id",
  "originalTitle": "Current product title",
  "newTitle": "Improved product title",
  "competitors": [],
  "competitorGaps": [],
  "evidence": [],
  "claimWarnings": [],
  "limitations": [],
  "analysisMode": "limited-competitor",
  "source": "hermes",
  "note": "optional status note"
}
```

The adapter also accepts the PRD's snake_case fields such as `shopify_title` and `new_title`, but the browser-facing response is normalized to `originalTitle` and `newTitle`.

### Convex persistence seam

When configured, the API POSTs the normalized audit to `CONVEX_AUDIT_URL` with:

```json
{
  "operation": "saveFreeAudit",
  "audit": {
    "auditId": "...",
    "productUrl": "...",
    "userEmail": "...",
    "status": "free_done",
    "originalTitle": "...",
    "newTitle": "...",
    "competitors": []
  }
}
```

The persistence call must not block a usable fallback result if Convex is unavailable; the response records `persistence: "saved"`, `"failed"`, or `"not_configured"`.

## Development workflow

1. Read the relevant PRD section and this file before changing code.
2. Inspect the existing implementation before editing.
3. Use test-first development for new behavior when a test framework exists.
4. Keep changes small and vertical; avoid unrelated dashboards or memory features.
5. Run `npm run build` after frontend or API changes.
6. Launch the app and exercise the browser path for user-facing changes.
7. Inspect browser console output and API responses.
8. Never report fallback/demo output as live Hermes, Convex, Dodo, email, or deployment behavior.
9. Update this file and `tasks/lessons.md` after meaningful corrections or discoveries.

## Review

- [x] Approved value proposition rendered at desktop and 390px mobile widths with no horizontal overflow or browser console errors.
- [x] Product decision recorded: v1 is payment-free and renders the full pack on screen; Dodo, paid access, payment records, webhooks, and email are v2.
- [x] PRD, agent instructions, README, task checklist, lessons, and user-facing copy aligned with the v1/v2 boundary.

- [x] Added the version-controlled Hermes skill under `hermes-skills/shopify-pdp-upgrade-audit` and installed it into `~/.hermes/skills`.
- [x] Hermes lists `shopify-pdp-upgrade-audit` as a local, enabled skill.
- [x] Synthetic audit verification returned the full contract and correctly withheld unsupported insulation, cup-holder fit, leak-proof, dishwasher-safe, and certification claims.
- [x] Updated the runtime adapter to preload the skill and request its expanded evidence-backed contract.
- [x] Local V1 E2E verification on `https://www.deathwishcoffee.com/products/death-wish-coffee` returned `source: hermes`, `mode: hermes`, `persistence: saved`, 5 competitors, a full pack, competitor gaps, evidence, claim warnings, limitations, and `analysisMode: limited-competitor`.
- [x] Browser verification on `http://127.0.0.1:8791/` rendered competitor gaps, claims to verify, audit limitations, Hermes output label, and saved status with no console warnings/errors and no horizontal overflow.

- [x] CEO review completed July 17, 2026: use scope reduction for v1. The product should prove that one no-install Shopify PDP audit can convert from a useful free preview into a $19 paid upgrade pack.
- [x] The free preview should show title improvement plus competitor-backed gaps; the paid pack must include SEO/copy outputs because those are table stakes in the market.
- [x] Market scan completed July 13, 2026: closest live competitors are ConvertMate, Describely, Hypotenuse AI, Shopify Sidekick/Magic, Profitonium ChatGPT AI Product Description, Avada AI Product Description, Smartli, and Perci as the Amazon-listing analogue.
- [x] Main positioning gap: most tools are bulk catalog generators or broad SEO suites; few sell a simple no-install, one-URL, competitor-benchmarked Shopify PDP audit with a fixed-price upgrade pack.
- [x] Added the live audit contract and Hermes normalization in `src/audit-core.js`.
- [x] Added optional Convex persistence via `CONVEX_AUDIT_URL`.
- [x] Added Vite environment loading and `.env.example` / `.dev.vars.example` templates.
- [x] Frontend now labels Hermes versus fallback output and reports persistence status.
- [x] `npm run build` passes.
- [x] Browser-tested the fallback path with `https://example.com` and confirmed no console errors.
- [x] Contract-tested mocked Hermes plus mocked Convex response; returned `source: "hermes"` and `persistence.status: "saved"`.
- [x] Added Convex schema, audit mutations, payment mutation, and HTTP action.
- [x] Provisioned a Convex development deployment and verified its HTTP action with status 200.
- [x] Bundled all three Pages Functions successfully after fixing the nested import path.
- [x] Live Linkup request returned HTTP 200 and five competitor results.
- [x] Linkup-backed title output is explicitly labeled `linkup-benchmarked-fallback`.
- [x] Structured PDP extraction now returns title, description, price, headings, bullets, images, and JSON-LD.
- [x] Local real integration harness passed: Linkup returned 5 competitors, Convex saved the audit, and the stored full pack was returned.
- [x] True Hermes agent adapter implemented: PDP scrape → Linkup competitors → Hermes CLI → strict full-pack JSON.
- [x] Public Quick Tunnel returned a real `source: hermes`, `mode: hermes` response with 5 competitors and all full-pack fields.
- [ ] Set the production Cloudflare `HERMES_UPSTREAM_URL` to the reachable adapter and redeploy/verify a real Shopify PDP.
- [ ] Production `/api/audit` verification/redeploy remains pending because Wrangler is not authenticated in this session.
- [x] Dodo checkout contract test passed: product cart, customer email, return URL, and audit metadata are sent server-side.
- [x] Dodo route bundled with all Pages Functions and the frontend build passes.
- [ ] Live Dodo test checkout returned HTTP 401 Unauthorized; replace the test/live API key pairing before charging or claiming checkout is live.

Local `.dev.vars` or shell environment:

- `HERMES_AUDIT_URL` — required for live Hermes generation
- `CONVEX_AUDIT_URL` — required for live audit persistence, unless the Hermes service owns persistence

Later:

- V2: Dodo API key, product/checkout configuration, and webhook secret
- Convex deployment URL and auth/deployment credentials
- V2: Email provider credentials

Never commit `.env`, `.dev.vars`, tokens, API keys, or webhook secrets.
