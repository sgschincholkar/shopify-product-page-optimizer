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
- Storage: Convex
- Payments: Dodo one-time checkout, $19 per audit
- Email: backend-triggered full-pack delivery

## Status

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
- [ ] Verify request → Hermes → Convex → result with real credentials

### Remaining full build

- [x] Add Convex `stores`, `audits`, and `payments` schema/functions
- [x] Provision a Convex development deployment and HTTP action
- [x] Verify Convex `/api/audit` OPTIONS response with HTTP 200
- [ ] Extract complete PDP context: description, bullets, price, reviews, images
- [x] Discover and extract up to 5 relevant competitor PDPs through Linkup
- [x] Add fallback behavior when competitor discovery fails
- [ ] Analyze positioning, claims, objections, pricing, and keyword patterns
- [ ] Generate structured free title output through Hermes
- [ ] Add Convex `stores`, `audits`, and `payments` schema/functions
- [ ] Add fallback behavior when competitor discovery fails
- [ ] Add Dodo checkout with audit ID metadata
- [ ] Add signed, idempotent Dodo webhook
- [ ] Mark audits paid and persist payment records in Convex
- [ ] Generate and persist the full upgrade pack after payment
- [ ] Add paid full-pack screen
- [ ] Add email delivery
- [ ] Deploy to Cloudflare Pages and configure production secrets
- [ ] Run real end-to-end demo on a public Shopify PDP
- [ ] Verify Dodo dashboard shows a live payment

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
- [ ] True Hermes upstream generation remains pending because `HERMES_UPSTREAM_URL` is missing.
- [ ] Current Dodo CTA remains an explicit placeholder.

Local `.dev.vars` or shell environment:

- `HERMES_AUDIT_URL` — required for live Hermes generation
- `CONVEX_AUDIT_URL` — required for live audit persistence, unless the Hermes service owns persistence

Later:

- Dodo API key, product/checkout configuration, and webhook secret
- Convex deployment URL and auth/deployment credentials
- Email provider credentials

Never commit `.env`, `.dev.vars`, tokens, API keys, or webhook secrets.
