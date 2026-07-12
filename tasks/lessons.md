# Lessons

## 2026-07-12

- The build must remain in `/Users/sgschincholkar/shopify-product-page-optimizer`; do not move it to the misspelled `docuemts` path or another workspace.
- The PRD is the source of truth for the stack: Vite/Cloudflare Pages frontend, Hermes audit agent, Convex storage, Dodo checkout, and email delivery.
- Demo fixtures must be labeled as demo behavior until real Hermes, Convex, Dodo, and email integrations are exercised.
- Use only the skills needed for the current project; do not create duplicate skills when existing installed skills cover the workflow.

## Review

- Captured the global Claude working rules and PRD-aligned V1 sequence in `tasks/todo.md`.
- No application behavior changed in this step.
- Payment is intentionally deferred while the application is developed end to end. The current development path shows and persists the full pack without Dodo.
- The full pack is currently a transparent fallback generator; it must not be described as live Hermes output until `HERMES_UPSTREAM_URL` is configured and exercised.
