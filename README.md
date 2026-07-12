# Shopify Product Page Optimizer (PDP Signal)

Paste a public Shopify product page URL and get a competitor-benchmarked upgrade pack — a better title, benefit-first bullets, FAQs, trust copy, SEO fields, and image suggestions — for $19 per audit. The upgraded title is free.

No Shopify app install, theme edits, or admin access needed. Everything runs off-store against the public product page.

## How it works

1. A merchant lands on the single-page app and enters their **email** and **product page URL**.
2. The app calls `POST /api/audit`, which runs a free title-only audit and shows **original title vs. upgraded title** side by side.
3. The merchant can then unlock the **full upgrade pack for $19** via Dodo checkout.
4. After payment, the full pack is generated and emailed, and the audit is stored in Convex.

Target: first free title shown in under 90 seconds.

## Current status

This is a v1 build in progress. Honest breakdown of what's live vs. planned:

| Piece | Status |
|---|---|
| Landing page (hero, form, processing/success/error states) | ✅ Built |
| Free audit API with title extraction + heuristic rewrite fallback | ✅ Built |
| Hermes audit proxy endpoint (`/api/hermes/audit`) | ✅ Built (needs `HERMES_UPSTREAM_URL` configured) |
| Dodo webhook with signature verification (Standard Webhooks HMAC) | ✅ Built (needs `DODO_WEBHOOK_SECRET` + Convex configured) |
| Hermes agent doing real competitor discovery + benchmarked titles | 🔜 Planned — the app falls back to a heuristic title until `HERMES_AUDIT_URL` is set |
| Convex persistence (`stores`, `audits`, `payments`) | 🔜 Planned — persistence is skipped until `CONVEX_AUDIT_URL` is set |
| Dodo $19 checkout redirect from the frontend | 🔜 Planned — the "Unlock full pack" button currently shows a placeholder alert |
| Full pack generation + email delivery | 🔜 Planned |

The UI labels every result as either a **Hermes benchmarked title** or a **fallback title preview**, so demo behavior is never passed off as the real integration.

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
JSON result: { auditId, originalTitle, newTitle, competitors, source, note, persistence }

Payment (planned wiring):
Dodo checkout → POST /api/dodo/webhook (HMAC-verified)
   → Convex (operation: markAuditPaid) → full pack generation → email
```

### Stack

- **Frontend:** Vanilla JS + [Vite](https://vitejs.dev/), single-page static app. No framework.
- **API:** [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) under `functions/api/`. In local dev, the same handler is mounted at `/api/audit` by a Vite middleware plugin (`vite.config.js`), so frontend and API share one dev server.
- **Audit engine:** Hermes agent (loads the PDP, finds 3–5 competitor pages via search/Linkup, extracts copy, generates the upgrade). Proxied through `/api/hermes/audit`.
- **Storage:** [Convex](https://www.convex.dev/) — `stores`, `audits`, `payments` tables (planned).
- **Payments:** [Dodo Payments](https://dodopayments.com/) one-time $19 checkout, confirmed via a signed webhook.
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

Open the printed localhost URL, paste any public Shopify product URL and an email, and you'll get the fallback title rewrite immediately — no external services needed.

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
| `CONVEX_AUDIT_URL` | Convex HTTP action accepting `operation: saveFreeAudit` / `markAuditPaid`. Unset = no persistence. |

**Cloudflare Pages / wrangler dev** — copy `.dev.vars.example` to `.dev.vars` locally, and set the same variables (plus `DODO_WEBHOOK_SECRET`) in the Pages project settings for production.

| Variable | Purpose |
|---|---|
| `DODO_WEBHOOK_SECRET` | Dodo webhook signing secret (`whsec_…`). The webhook returns 503 until this is set. |

Never commit `.env`, `.env.local`, or `.dev.vars` — they're gitignored.

## API

### `POST /api/audit`

Free title audit.

**Request**

```json
{ "productUrl": "https://yourstore.com/products/example", "email": "you@yourbrand.com" }
```

(Snake_case `product_url` / `user_email` also accepted; optional `verticalHint`.)

**Response**

```json
{
  "auditId": "uuid",
  "productUrl": "https://yourstore.com/products/example",
  "originalTitle": "Example Product | Your Store",
  "newTitle": "Example Product — Clear benefits, made for everyday use",
  "competitors": [],
  "source": "hermes | page-title-fallback",
  "note": "…",
  "persistence": { "status": "saved | failed | not_configured" }
}
```

Errors return `{ "error": "…" }` with a 4xx status. The upstream Hermes call times out after 85 s; Convex persistence after 10 s (a persistence failure never fails the audit).

### `POST /api/hermes/audit`

Thin proxy to the configured Hermes upstream (`HERMES_UPSTREAM_URL`), attaching the bearer token if set. Returns 503 when unconfigured.

### `POST /api/dodo/webhook`

Dodo payment webhook. Verifies the [Standard Webhooks](https://www.standardwebhooks.com/) HMAC-SHA256 signature (`webhook-id`, `webhook-timestamp`, `webhook-signature` headers) against `DODO_WEBHOOK_SECRET` before processing. On `payment.succeeded` (and equivalents), it reads the `auditId` from payment metadata and marks the audit paid in Convex. Non-success events are acknowledged and ignored.

## Roadmap (from the PRD)

- [ ] Real Hermes audit agent: PDP extraction, 3–5 competitor discovery, benchmarked title generation
- [ ] Dodo checkout redirect wired to the audit ID via metadata
- [ ] Convex schema + functions: `stores`, `audits`, `payments`
- [ ] Full upgrade pack: title, 5–7 benefit bullets, 5–10 FAQs, trust copy, SEO meta fields, keywords, image suggestions
- [ ] Email delivery of the full pack after payment
- [ ] Later: repeat-user brand memory, founder dashboard, basic analytics

## Notes on claims & safety

Generated trust copy (badges, guarantees, "dermatologist-tested"–style claims) always carries a disclaimer: the merchant is responsible for making sure every claim is legally supportable. The tool never suggests obviously illegal or impossible claims, and never asks for Shopify admin access or merchant secrets.

## License

Private project — all rights reserved.
