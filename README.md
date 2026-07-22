# Shopify Product Page Optimizer (PDP Signal)

Find the gaps in your Shopify product page. Get the copy to fix them.

PDP Signal compares your page with 3–5 relevant competitors, uncovers SEO, conversion, trust, and buyer-objection gaps, then rewrites your title, description, benefits, FAQs, and metadata. V1 is payment-free; Dodo payments are deferred to v2.

No Shopify app install, theme edits, or admin access needed. Everything runs off-store against the public product page.

## How it works

1. A merchant lands on the single-page app and enters their **email** and **product page URL**.
2. The app calls `POST /api/audit`, which runs a free title-only audit and shows **original title vs. upgraded title** side by side.
3. Hermes generates and shows the **full upgrade pack** on screen.
4. The audit and result are stored in Convex when configured.

The v1 promise is a concrete page-gap analysis followed by a complete PDP rewrite. Processing time depends on the product page and competitor research availability.

## Current status

This is a v1 build in progress. Honest breakdown of what's live vs. planned:

| Piece | Status |
|---|---|
| Landing page (hero, form, processing/success/error states) | ✅ Built |
| Free audit API with title extraction + heuristic rewrite fallback | ✅ Built |
| Hermes audit proxy endpoint (`/api/hermes/audit`) | ✅ Built (needs `HERMES_UPSTREAM_URL` configured) |
| Dodo checkout and webhook | ⏭️ V2 only |
| Hermes agent doing real competitor discovery + benchmarked full packs | ✅ Verified locally with Linkup, 5 competitors, proof fields, and claim warnings |
| Convex audit persistence (`stores`, `audits`) | ✅ Verified on the development deployment |
| Full pack generation + on-screen rendering | ✅ Verified in payment-free V1 path |
| Dodo payments, paid access, payment records, email | ⏭️ V2 only |

The UI labels every result as either **Hermes-generated output** or a fallback preview, so demo behavior is never passed off as the real integration.

## Architecture

```
Browser (Vite static app, src/main.js)
   │  POST /api/audit  { productUrl, email }
   ▼
Cloudflare Pages Function (functions/api/audit.js → src/audit-core.js)
   │
   ├─ HERMES_AUDIT_URL set?
   │    ├─ yes → forward to Hermes audit service → normalized title result
   │    └─ no  → fetch the product page directly, extract the title
   │             (og:title → h1 → <title>), generate a heuristic rewrite
   │
   ├─ CONVEX_AUDIT_URL set? → persist audit (operation: saveFreeAudit)
   │
   ▼
JSON result: { auditId, originalTitle, newTitle, competitors, discoveryQueries, competitorGaps, evidence, claimWarnings, limitations, source, note, persistence }

V1 result path:
Hermes skill + Linkup → full pack → Convex audit persistence → on-screen result

V2 payment path:
Dodo checkout → signed webhook → paid audit state → email delivery
```

### Stack

- **Frontend:** Vanilla JS + [Vite](https://vitejs.dev/), single-page static app. No framework.
- **API:** [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) under `functions/api/`. In local dev, the same handler is mounted at `/api/audit` by a Vite middleware plugin (`vite.config.js`), so frontend and API share one dev server.
- **Audit engine:** Hermes agent (an adapter fetches the public PDP, extracts brand/category/search signals, runs focused Linkup searches, and passes the evidence to Hermes for the upgrade). Proxied through `/api/hermes/audit`.
- **Storage:** [Convex](https://www.convex.dev/) — audit persistence in v1; payment records are v2.
- **Payments:** [Dodo Payments](https://dodopayments.com/) one-time $19 checkout, v2 only.
- **Hosting:** Cloudflare Pages (`wrangler.toml`, build output in `dist/`).

## Project structure

```
├── index.html                     # Vite entry
├── src/
│   ├── main.js                    # Landing page UI, form handling, result rendering
│   ├── audit-core.js              # Shared audit logic: validation, title extraction,
│   │                              #   Hermes call, fallback rewrite, Convex persistence.
│   │                              #   Runs on both Cloudflare Workers and Node (dev).
│   └── style.css                  # Styles
├── functions/api/
│   ├── audit.js                   # POST /api/audit — free title audit
│   ├── hermes/audit.js            # POST /api/hermes/audit — proxy to Hermes upstream
│   └── dodo/webhook.js            # POST /api/dodo/webhook — payment confirmation
├── vite.config.js                 # Dev server + local /api/audit middleware
├── wrangler.toml                  # Cloudflare Pages config
├── PRD - Shopify Product Page Optimizer.md   # Full product requirements
├── AGENTS.md                      # Agent/contributor working instructions
└── tasks/                         # todo.md and lessons.md (working notes)
```

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev        # Vite dev server with /api/audit mounted locally
```

Open the printed localhost URL, paste any public Shopify product URL and an email, and you'll get a fallback title rewrite immediately with no external services. Configure `HERMES_AUDIT_URL` and `CONVEX_AUDIT_URL` for the live Hermes + Convex V1 path.

Other scripts:

```bash
npm run build      # Production build to dist/
npm run preview    # Preview the production build
npm run deploy     # Build + deploy to Cloudflare Pages via wrangler
```

## Configuration

All integrations are optional and gated behind environment variables. With nothing configured, the app still works end-to-end on the free tier using the fallback path.

**Local Vite dev** — copy `.env.example` to `.env.local`:

| Variable | Purpose |
|---|---|
| `HERMES_AUDIT_URL` | Hermes audit service endpoint. Unset = safe fallback (extract page title, heuristic rewrite). |
| `HERMES_UPSTREAM_URL` | Upstream Hermes server that `/api/hermes/audit` proxies to. |
| `HERMES_UPSTREAM_TOKEN` | Optional bearer token for the Hermes upstream. |
| `CONVEX_AUDIT_URL` | Convex HTTP action accepting `operation: saveFreeAudit`. Unset = no persistence. |

**Cloudflare Pages / wrangler dev** — copy `.dev.vars.example` to `.dev.vars` locally, and set the v1 Hermes, Linkup, and Convex variables in the Pages project settings for production. Dodo and email secrets are v2 only.

Never commit `.env`, `.env.local`, or `.dev.vars` — they're gitignored.

## API

### `POST /api/audit`

Free title audit.

**Request**

```json
{ "productUrl": "https://yourstore.com/products/example", "email": "you@yourbrand.com" }
```

(Snake_case `product_url` / `user_email` are also accepted. `verticalHint` remains an optional API-only category hint; the customer form does not require it because category signals are inferred from the PDP.)

**Response**

```json
{
  "auditId": "uuid",
  "productUrl": "https://yourstore.com/products/example",
  "originalTitle": "Example Product | Your Store",
  "newTitle": "Example Product — Clear benefits, made for everyday use",
  "competitors": [],
  "discoveryQueries": [],
  "competitorGaps": [],
  "evidence": [],
  "claimWarnings": [],
  "limitations": [],
  "analysisMode": "merchant-only-fallback | limited-competitor | full-competitor",
  "source": "hermes | page-title-fallback",
  "note": "…",
  "persistence": { "status": "saved | failed | not_configured" }
}
```

Errors return `{ "error": "…" }` with a 4xx status. The upstream Hermes call times out after 85 s; Convex persistence after 10 s (a persistence failure never fails the audit).

### `POST /api/hermes/audit`

Thin proxy to the configured Hermes upstream (`HERMES_UPSTREAM_URL`), attaching the bearer token if set. Returns 503 when unconfigured.

### `POST /api/dodo/webhook` (v2 only)

The Dodo payment webhook remains isolated for v2. It is not part of the v1 runtime path.

## Roadmap (from the PRD)

- [ ] Real production Hermes audit: PDP extraction, 3–5 competitor discovery, benchmarked full pack
- [ ] Production Convex audit persistence
- [ ] End-to-end production test with a public Shopify PDP
- [ ] V2: Dodo checkout, payment webhook, payment records, and email delivery
- [ ] Later: repeat-user brand memory, founder dashboard, basic analytics

## Notes on claims & safety

Generated trust copy (badges, guarantees, "dermatologist-tested"–style claims) always carries a disclaimer: the merchant is responsible for making sure every claim is legally supportable. The tool never suggests obviously illegal or impossible claims, and never asks for Shopify admin access or merchant secrets.

## License

Private project — all rights reserved.
