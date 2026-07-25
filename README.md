# Shopify Product Page Optimizer (PDP Signal)

Find the gaps in your Shopify product page. Get the copy to fix them.

PDP Signal compares your page with 3–5 relevant competitors, uncovers SEO, conversion, trust, and buyer-objection gaps, then rewrites your title, description, benefits, FAQs, and metadata. V1 is payment-free; Dodo payments are deferred to v2.

No Shopify app install, theme edits, or admin access needed. Everything runs off-store against the public product page.

## How it works

1. A merchant lands on the single-page app and enters their **email** and **product page URL**.
2. The app calls `POST /api/audit` with `Accept: application/x-ndjson` and streams results back progressively instead of waiting on one long request:
   - **~2-5s** — page scraped, original title + a heuristic upgrade pack appear immediately
   - **~10-35s** — competitor pages found, pack updates with competitor-informed copy
   - **~30-90s** — Hermes finishes the full analysis: real gaps, claim warnings, and the final copy pack replace the heuristic version
3. Each section shows a live score badge (heuristic now, Hermes-generated later) and its supporting citations.
4. The audit and result are stored in Convex when configured, streamed back as a final `audit_persisted` event.

The v1 promise is a concrete page-gap analysis followed by a complete PDP rewrite. Streaming means the user sees useful output within seconds instead of staring at a loading screen — and if the final Hermes step fails, the competitor-informed fallback pack is already on screen instead of a dead error.

## Current status

This is a v1 build in progress. Honest breakdown of what's live vs. planned:

| Piece | Status |
|---|---|
| Landing page (hero, form, processing/success/error states) | ✅ Built |
| Scored, cited, routable report page (`/report/:auditId`) | ✅ Built |
| NDJSON streaming — progressive results instead of one long request | ✅ Built and verified live in production |
| Free audit API with title extraction + heuristic rewrite fallback | ✅ Built |
| Hermes audit proxy endpoint (`/api/audit`, streaming-aware) | ✅ Built |
| `/api/hermes/audit` (pre-streaming proxy) | ⚠️ Deprecated — kept for backward compatibility, will be removed |
| Dodo checkout and webhook | ⏭️ V2 only |
| Hermes agent doing real competitor discovery + benchmarked full packs | ✅ Verified locally and in production with Linkup, 5 competitors, proof fields, and claim warnings |
| Hermes CLI reliability on real (large) prompts | ⚠️ Known issue — currently fails on some production pages; streaming pipeline degrades gracefully to the fallback pack when this happens |
| Convex audit persistence (`stores`, `audits`) | ✅ Verified on the development deployment |
| Full pack generation + on-screen rendering | ✅ Verified in payment-free V1 path |
| Dodo payments, paid access, payment records, email | ⏭️ V2 only |

The UI labels every result as either **Hermes-generated output** or a fallback preview, so demo behavior is never passed off as the real integration.

## Architecture

The audit pipeline streams results over NDJSON (newline-delimited JSON) instead of buffering one long response. This exists because content-heavy Shopify pages regularly took 60-90s end to end, which used to exceed Cloudflare's request timeout and fail with "Operation aborted." Streaming means the user sees the scraped title within seconds and the report fills in as each pipeline step finishes.

```
Browser (Vite static app, src/main.js)
   │  POST /api/audit  { productUrl, email }
   │  Accept: application/x-ndjson
   ▼
Cloudflare Pages Function (functions/api/audit.js)
   │  pipes the upstream response stream straight through — near-zero CPU
   ▼
Railway Node host (scripts/hermes-audit-server.mjs)
   │
   ├─ scrapePdp()            ──▶ emit "pdp_scraped"        (~2-5s)
   │     extracts title, description, headings, structured data
   │     also computes a heuristic fallback pack (createFullPack) for
   │     instant display — no external calls needed
   │
   ├─ discoverCompetitors()  ──▶ emit "competitors_found"  (~10-35s)
   │     3 Linkup queries run in parallel, depth: 'deep'
   │     recomputes the heuristic pack using competitor terms
   │
   ├─ runHermes()            ──▶ emit "hermes_complete"    (~30-90s)
   │     shells out to `hermes chat` (deepseek/deepseek-v4-flash via
   │     OpenRouter) with the full PDP + competitor context
   │     on failure: emits "step_error" — the competitor-informed
   │     fallback pack already on screen stays as the final answer
   │
   └─ persistAudit()         ──▶ emit "audit_persisted"
         saves to Convex once the pipeline finishes
```

Each step's three sequential stages have real data dependencies (competitor search needs the scraped brand/category; the LLM prompt needs both scrape + competitor evidence), so they can't run in parallel — but each stage's output is useful on its own and gets rendered immediately rather than held back until the whole pipeline finishes.

Content negotiation: sending `Accept: application/x-ndjson` gets the streaming response; anything else gets the legacy single-JSON response (used by curl, tests, and any non-streaming client). `parseNdjsonStream()` in `src/audit-core.js` is the shared reader used by the frontend.

```
V2 payment path (not yet built):
Dodo checkout → signed webhook → paid audit state → email delivery
```

### Stack

- **Frontend:** Vanilla JS + [Vite](https://vitejs.dev/), single-page static app. No framework. Reads the NDJSON stream via `ReadableStream` + `TextDecoderStream`, no `EventSource` (SSE requires GET; this is a POST).
- **API:** [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) under `functions/api/`. `functions/api/audit.js` pipes the upstream stream through when the client asks for NDJSON, or buffers a single JSON response otherwise. In local dev, `/api/audit` is mounted by a Vite middleware plugin (`vite.config.js`); set `MOCK_STREAM=1` to serve fake streaming events with realistic delays, no Railway/Linkup credentials needed.
- **Audit engine:** Hermes agent running through a permanent Node adapter on Railway (`scripts/hermes-audit-server.mjs`). The adapter fetches the public PDP, extracts brand/category/search signals, runs focused Linkup searches, and invokes `hermes chat --skills shopify-pdp-upgrade-audit` via OpenRouter.
- **Storage:** [Convex](https://www.convex.dev/) — audit persistence in v1; payment records are v2.
- **Payments:** [Dodo Payments](https://dodopayments.com/) one-time $19 checkout, v2 only.
- **Hosting:** Cloudflare Pages for the frontend + API proxy (`wrangler.toml`, build output in `dist/`); Railway for the long-running Hermes/Linkup Node process.

## Project structure

```
├── index.html                     # Vite entry
├── src/
│   ├── main.js                    # Landing/report SPA router, streaming handler,
│   │                              #   progressive section rendering
│   ├── audit-core.js              # Shared audit logic: validation, title extraction,
│   │                              #   scoring, NDJSON stream parsing, Hermes call,
│   │                              #   fallback rewrite, Convex persistence.
│   │                              #   Runs on both Cloudflare Workers and Node (dev/Railway).
│   └── style.css                  # Styles — three-layer tokens (primitive/semantic/component)
├── functions/api/
│   ├── audit.js                   # POST /api/audit — streams NDJSON when Accept
│   │                              #   asks for it, else returns single JSON
│   ├── hermes/audit.js            # Deprecated pre-streaming proxy, kept temporarily
│   └── dodo/webhook.js            # POST /api/dodo/webhook — payment confirmation
├── scripts/
│   └── hermes-audit-server.mjs    # Railway host — scrape → Linkup → Hermes CLI,
│                                  #   emits NDJSON events after each step
├── vite.config.js                 # Dev server + local /api/audit middleware;
│                                  #   MOCK_STREAM=1 for fake streaming events
├── wrangler.toml                  # Cloudflare Pages config
├── public/_redirects              # SPA fallback so /report/:auditId doesn't 404
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

Open the printed localhost URL, paste any public Shopify product URL and an email, and you'll get a fallback title rewrite with no external services. Configure `HERMES_AUDIT_URL` and `CONVEX_AUDIT_URL` for the live Hermes + Convex V1 path.

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

### Production Hermes host

Cloudflare Pages cannot run the current Hermes CLI because the CLI is a local subprocess with a Hermes installation and installed Hermes skills. Keep the Pages site and API functions on Cloudflare, and run `scripts/hermes-audit-server.mjs` on a permanent Node host.

The host must provide Node.js, the `hermes` executable on `PATH`, and the `shopify-pdp-upgrade-audit` skill installed in its Hermes profile. Set `LINKUP_API_KEY`, optionally set `HERMES_UPSTREAM_TOKEN`, and start the service with:

```bash
npm run hermes:adapter
```

Set `HOST=0.0.0.0`; the host supplies `PORT`. Currently deployed on Railway; `Dockerfile.hermes` and `render.yaml` remain in the repo as an alternate Render deployment path but are not the live target. Verify `GET /health`, then set Cloudflare's `HERMES_AUDIT_URL` (and/or `HERMES_UPSTREAM_URL`) to the host's HTTPS URL. This is a backend runtime service, not a second customer-facing app.

The Hermes model provider credentials must also be added to the host using the provider's supported environment variables or Hermes configuration. Do not commit those credentials or copy the local Hermes profile into the repository. Currently running `--provider openrouter -m deepseek/deepseek-v4-flash`, authenticated with `OPENROUTER_API_KEY` — not a plain OpenAI key (Hermes has no bare `openai` provider; see `hermes-audit-debug` skill for the full provider list).

```text
Browser -> Cloudflare Pages /api/audit (streams NDJSON when asked)
        -> Railway Hermes Node host -> scrape + Linkup + hermes chat + skill
        -> Convex persistence -> browser, section by section
```

Never commit `.env`, `.env.local`, or `.dev.vars` — they're gitignored.

## API

### `POST /api/audit`

Payment-free V1 audit. Supports both streaming and legacy single-response modes via content negotiation.

**Request**

```json
{ "productUrl": "https://yourstore.com/products/example", "email": "you@yourbrand.com" }
```

(Snake_case `product_url` / `user_email` are also accepted. `verticalHint` remains an optional API-only category hint; the customer form does not require it because category signals are inferred from the PDP.)

#### Streaming mode (`Accept: application/x-ndjson`)

Response is `application/x-ndjson` — one JSON object per line, each with an `event` and `data` field. Used by the frontend.

```jsonl
{"event":"audit_started","data":{"auditId":"uuid","productUrl":"...","ts":1234567890}}
{"event":"pdp_scraped","data":{"originalTitle":"...","pdpContext":{...},"freePack":{...}}}
{"event":"competitors_found","data":{"competitors":[...],"discoveryQueries":[...],"enrichedPack":{...}}}
{"event":"hermes_complete","data":{"newTitle":"...","fullPack":{...},"competitorGaps":[...],"evidence":[...],"claimWarnings":[...],"limitations":[...],"analysisMode":"..."}}
{"event":"audit_persisted","data":{"persistence":{"status":"saved"}}}
```

Error events can appear instead of (or interleaved with) the events above:

```jsonl
{"event":"step_error","data":{"step":"hermes","error":"...","recoverable":true}}
{"event":"fatal_error","data":{"error":"PDP returned HTTP 404."}}
{"event":"keepalive","data":{"ts":1234567890}}
```

A `step_error` with `recoverable: true` means the stream continues — the frontend keeps whatever partial pack it already has (e.g. the competitor-informed fallback if Hermes fails) rather than showing a dead end. `fatal_error` ends the stream early (e.g. the product page itself couldn't be fetched). `keepalive` fires every 25s during long steps so the connection doesn't idle out.

Try it directly:

```bash
curl -N -X POST -H 'Accept: application/x-ndjson' -H 'Content-Type: application/json' \
  -d '{"productUrl":"https://yourstore.com/products/example","email":"you@yourbrand.com"}' \
  https://your-app.pages.dev/api/audit
```

#### Legacy mode (no `Accept: application/x-ndjson`)

Buffers the full pipeline and returns one JSON object — used by curl without the header, tests, and any non-streaming client.

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
  "source": "hermes | fallback",
  "note": "…",
  "persistence": { "status": "saved | failed | not_configured" }
}
```

Errors return `{ "error": "…" }` with a 4xx status. Convex persistence times out after 10s (a persistence failure never fails the audit).

### `POST /api/hermes/audit` (deprecated)

Pre-streaming proxy to the configured Hermes upstream. Kept temporarily for backward compatibility; new work should go through `/api/audit`.

### `POST /api/dodo/webhook` (v2 only)

The Dodo payment webhook remains isolated for v2. It is not part of the v1 runtime path.

## Roadmap (from the PRD)

- [x] Deploy the verified V1 path to Cloudflare Pages with production Hermes, Linkup, and Convex variables
- [x] Run and document an end-to-end production test with a public Shopify PDP
- [x] Stream audit results progressively (NDJSON) instead of one long request
- [ ] Fix Hermes CLI reliability on real (large) production prompts — currently fails and falls back to the heuristic pack on some pages
- [ ] Interactive competitor review — let the user exclude a competitor before the LLM analysis runs (needs a second request; NDJSON is one-directional)
- [ ] Remove the deprecated `/api/hermes/audit` endpoint once nothing calls it
- [ ] V2: Dodo checkout, payment webhook, payment records, and email delivery
- [ ] Later: repeat-user brand memory, founder dashboard, basic analytics

## Notes on claims & safety

Generated trust copy (badges, guarantees, "dermatologist-tested"–style claims) always carries a disclaimer: the merchant is responsible for making sure every claim is legally supportable. The tool never suggests obviously illegal or impossible claims, and never asks for Shopify admin access or merchant secrets.

## License

Private project — all rights reserved.
