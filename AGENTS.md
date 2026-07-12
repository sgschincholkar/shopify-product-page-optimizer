# Shopify Product Page Optimizer — Agent Instructions

## Source of truth

- Product requirements: `PRD - Shopify Product Page Optimizer.md`
- Workspace: `/Users/sgschincholkar/shopify-product-page-optimizer`
- Project task tracking: `tasks/todo.md` and `tasks/lessons.md`
- Global working rules: `/Users/sgschincholkar/.claude/CLAUDE.md`

The PRD is the product and integration source of truth. Do not replace its named stack or claim an integration is live until it has been exercised.

## Product goal

Build a web app where a Shopify merchant submits a public product-page URL and email, receives a free improved title, and can later pay $19 for a complete competitor-benchmarked upgrade pack.

The primary v1 path is:

1. Landing page on Cloudflare Pages.
2. Email and public Shopify URL submission.
3. Hermes audit request.
4. Product-page and competitor extraction.
5. Free upgraded title result: original title versus new title.
6. Dodo checkout for the paid full pack.
7. Convex persistence, full-pack generation, and email delivery.

No Shopify admin access or merchant secrets are required.

## Stack and boundaries

- Frontend: Vite static app, deployable to Cloudflare Pages.
- Cloudflare API surface: `functions/api/`.
- Audit execution: Hermes audit agent/server.
- Storage: Convex functions and database.
- Payment: Dodo one-time checkout, $19 per audit.
- Email: backend-triggered full-pack delivery.

Keep integrations behind explicit seams. Demo fixtures and fallback title generation must be labeled as fallback/demo behavior. Never describe them as live Hermes, competitor analysis, Convex, Dodo, email, or deployment behavior.

The app currently has a fallback audit path that extracts a page title and generates a heuristic title. The next implementation work must replace or extend this with the real Hermes-backed free-audit path without removing graceful fallback behavior.

## Required v1 behavior

### Landing page

- Hero explains the 90-second Shopify PDP upgrade promise.
- Required inputs: email and product URL.
- Primary CTA: `Get free upgraded title`.
- Show empty, validation, processing, success, and recoverable-error states.
- Success state shows original title, upgraded title, and `Unlock full pack for $19`.
- Keep controls keyboard accessible with visible labels and focus states.
- Preserve responsive behavior and reduced-motion support.

### Free audit

Inputs:

- `product_url`
- `user_email`
- Optional vertical hint later.

The real audit should:

1. Load and extract the public PDP: title, description, bullets, price, review summary, and images.
2. Discover 3–5 relevant competitor PDPs through search/Linkup or the configured web tools.
3. Extract competitor titles, bullets, prices, claims, and trust markers.
4. Analyze missing claims, price positioning, objections, questions, and title/search-language patterns.
5. Generate an improved title optimized for clarity and click-through.
6. Return structured JSON plus copy-paste-ready text.

If competitor discovery fails, still generate a title from the original PDP and clearly record the fallback condition.

### Paid work planned after the free path

Do not implement paid behavior as if it were live without credentials and verification. The planned contract is:

- Dodo checkout linked to the audit ID through metadata or query parameters.
- Verified Dodo webhook marks the audit paid and creates a payment record.
- Convex tables: `stores`, `audits`, `payments`.
- Full pack fields: title, 5–7 benefits-first bullets, 5–10 FAQs, legally supportable trust copy, SEO fields, keywords, image suggestions, and copy-paste-ready blocks.
- Email the full pack after successful payment.

All suggested claims must include a legal-supportability disclaimer. Never suggest obviously illegal or impossible claims.

## Development workflow

For any non-trivial change:

1. Read the relevant PRD section and current task/lesson files.
2. Inspect the existing implementation before editing.
3. Write or update a checkable plan in `tasks/todo.md` when the work spans three or more steps.
4. Prefer vertical slices over broad unfinished scaffolding.
5. For new behavior or bug fixes, use test-first development where a test framework exists: write a failing test, verify the failure, implement the smallest fix, then refactor.
6. Run the relevant tests and `npm run build`.
7. Launch the app and exercise the affected browser path. Inspect console errors.
8. Review limitations honestly. Do not report an untested integration as complete.
9. Update `tasks/lessons.md` after user corrections or non-trivial workflow discoveries.

Use simple solutions and minimize unrelated changes. Do not add dashboards, repeat-user memory, or unrelated features before the core audit path works.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

The local API is mounted at `/api/audit` during Vite development and at the Cloudflare Pages function route in deployment.

## Skills to use

These Hermes-native skills are available and relevant:

- `frontend-landing-build`: required for landing-page implementation and browser verification.
- `hermes-agent`: required when configuring or extending Hermes, its audit server, tools, providers, webhooks, or skills. Hermes remains the harness when using `hermes chat --provider ...`.
- `test-driven-development`: use for new behavior and bug fixes when tests can be added.
- `systematic-debugging`: use when the audit path or integration fails; establish reproduction and root cause before editing.
- `requesting-code-review`: use before committing or shipping multi-file implementation changes. This requires a git diff; if the workspace is not a git repository, report that limitation or initialize one explicitly before review.
- `codex`: use only when delegating implementation to the standalone OpenAI Codex CLI. `codex exec` makes Codex the harness; `hermes chat --provider openai-codex` does not.
- `dogfood`: use for exploratory QA of the deployed or local web app.
- `plan`: use when a written implementation plan is needed before execution.

Claude-specific files under `~/.claude/skills/` are not automatically Hermes skills. Use Hermes `skill_view()` for installed Hermes skills; inspect or run Claude/gstack files only when explicitly needed.

## Agent and provider distinction

- `hermes chat --provider openai-codex`: Hermes is the harness; OpenAI Codex supplies model inference.
- `codex exec "..."`: OpenAI Codex CLI is the harness.
- `delegate_task`: Hermes spawns an isolated Hermes subagent; it is not the standalone Codex CLI unless explicitly configured through an external ACP command.

## Verification and reporting

Before calling work complete, report:

- Files changed.
- Commands run and their real output.
- Browser path exercised, if applicable.
- Tests/build status.
- What is live versus fallback, simulated, unconfigured, or blocked.

Never fabricate scraper results, competitor data, payment confirmations, Convex records, emails, deployment URLs, or test output.


<claude-mem-context>
# Memory Context

# [shopify-product-page-optimizer] recent context, 2026-07-12 3:01pm GMT+5:30

No previous sessions found.
</claude-mem-context>