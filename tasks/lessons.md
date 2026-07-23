# Lessons

## 2026-07-12

- The build must remain in `/Users/sgschincholkar/shopify-product-page-optimizer`; do not move it to the misspelled `docuemts` path or another workspace.
- The PRD is the source of truth for the stack: Vite/Cloudflare Pages frontend, Hermes audit agent, and Convex audit persistence in v1. Dodo payments, payment records, and email delivery are v2.
- Demo fixtures must be labeled as demo behavior until real Hermes, Convex, Dodo, and email integrations are exercised.
- Use only the skills needed for the current project; do not create duplicate skills when existing installed skills cover the workflow.

## 2026-07-17

- When the user provides replacement AGENTS.md instructions in the chat, treat those as active for the session even if the checked-in `AGENTS.md` file has not yet been rewritten.
- For this product, do not frame the wedge as competitor benchmarking alone. The paid value is a complete paste-ready PDP upgrade pack; competitor evidence is the trust layer.
- The value proposition must state the merchant problem and outcome, then explain the competitor analysis and deliverables; do not make an unsupported time guarantee part of the promise.
- Avoid vague mechanism labels such as "competitor-backed" and output-format labels such as "paste-ready" in the headline. Lead with the merchant problem and outcome, then explain the 3–5 competitor analysis and deliverables in supporting copy.

## 2026-07-22

- Global Codex or Claude skills are not automatically available to Hermes; keep a version-controlled Hermes-native skill and install it into the active `~/.hermes/skills` profile.
- Preload required runtime skills explicitly with `hermes chat --skills <name>` so production behavior does not depend on optional skill selection.
- Keep the adapter prompt and the skill output contract aligned; an older inline JSON schema can override or weaken a newer skill contract.

## Review

- Captured the global Claude working rules and PRD-aligned V1 sequence in `tasks/todo.md`.
- No application behavior changed in this step.
- Payment is intentionally deferred while the application is developed end to end. The current development path shows and persists the full pack without Dodo.
- The full pack is currently a transparent fallback generator; it must not be described as live Hermes output until `HERMES_UPSTREAM_URL` is configured and exercised.

## 2026-07-22

- Product decision: keep v1 fully payment-free. The end-to-end v1 path generates and renders the complete upgrade pack and optionally persists the audit in Convex.
- Do not spend v1 work on Dodo checkout, payment webhooks, paid state, payment records, or post-payment email. Preserve those integrations as v2 work only.
- Preserve Hermes proof fields explicitly at every boundary. The competitive wedge depends on `competitorGaps`, `evidence`, `claimWarnings`, `limitations`, and `analysisMode`, so normalization, persistence, and rendering must treat them as first-class response fields.

## 2026-07-23

- A title-only competitor query loses the strongest discovery signals. Extract brand/category/search terms first, use the brand for exclusion rather than search intent, and keep the exact query list as evidence.
- Do not remove individual brand tokens from queries: shared words such as `coffee` can be both a brand token and the actual product category. Remove the full brand phrase instead.
- Keep the task checklist synchronized with the actual browser contract: generated description and keywords are not complete V1 deliverables until they are rendered in the result screen, and local verification must remain distinct from production deployment.
- A Cloudflare Pages deployment can be healthy while the audit still falls back: production requires a permanent, reachable Hermes host. Account-less quick tunnels are suitable only for experiments and are not reliable production upstreams.
- Keep Hermes as the runtime operator: Cloudflare Pages is the web/API edge, while a permanent Node host runs the Hermes CLI, installed skills, scraping, and Linkup orchestration. Moving everything into a Worker would require replacing `hermes chat` with a model API and would change the runtime rather than simplify this product.
- A permanent Hermes host must provision three separate things: the adapter process, the version-controlled Hermes skill, and Hermes model-provider credentials. Linkup and the upstream bearer token are separate service secrets.
