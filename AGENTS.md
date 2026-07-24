# Shopify Product Page Optimizer — Agent Instructions

## Source of truth

- Product requirements: `PRD - Shopify Product Page Optimizer.md`
- Workspace: `/Users/sgschincholkar/shopify-product-page-optimizer`
- Project task tracking: `tasks/todo.md` and `tasks/lessons.md`
- Global working rules: `/Users/sgschincholkar/.claude/CLAUDE.md`

The PRD is the product and integration source of truth. Do not replace its named stack or claim an integration is live until it has been exercised.

## Product goal

Build a web app where a Shopify merchant submits a public product-page URL and email, receives a complete competitor-benchmarked upgrade pack on screen, and can later pay $19 for delivery/access in v2.

The primary v1 path is:

1. Landing page on Cloudflare Pages.
2. Email and public Shopify URL submission.
3. Hermes audit request.
4. Product-page and competitor extraction.
5. Free upgraded title result: original title versus new title.
6. Convex persistence and full-pack generation.

Payment, paid access, Dodo checkout, payment webhooks, payment records, and email delivery are v2 only.

No Shopify admin access or merchant secrets are required.

## Stack and boundaries

- Frontend: Vite static app, deployable to Cloudflare Pages.
- Cloudflare API surface: `functions/api/`.
- Audit execution: Hermes audit agent/server.
- Storage: Convex functions and database for audit persistence; payment records are v2.
- Payment: Dodo one-time checkout, $19 per audit, v2 only.
- Email: backend-triggered full-pack delivery, v2 only.

Keep integrations behind explicit seams. Demo fixtures and fallback title generation must be labeled as fallback/demo behavior. Never describe them as live Hermes, competitor analysis, Convex, Dodo, email, or deployment behavior.

The app has both a real Hermes-backed audit path and a fallback path that extracts a page title and generates a heuristic title. Preserve graceful fallback behavior while production configuration is completed.

## Required v1 behavior

### Landing page

- Hero promises: `Find the gaps in your Shopify product page. Get the copy to fix them.`
- Supporting copy explains the 3–5 competitor comparison and the SEO, conversion, trust, and buyer-objection gaps analyzed.
- Required inputs: email and product URL.
- Primary CTA: `Analyze my product page`.
- Show empty, validation, processing, success, and recoverable-error states.
- Success state shows original title, upgraded title, and the complete full pack.
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

### V2 work planned after the payment-free v1 path

Do not implement payment behavior in v1. When v2 begins, the planned contract is:

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

Two global Claude skills (`~/.claude/skills/`, available in every project) apply directly here:

- `deploy-check`: run automatically right after any deploy to Cloudflare Pages, Railway, or Render — before reporting a deploy as live. Checks repo config (`render.yaml`, `Dockerfile.hermes`) against actual platform dashboard state (builder type, plan/tier, env vars) and hits the health check directly. Do not wait to be asked; a deploy is unverified until this runs. This is the exact class of bug (Render silent free tier, Railway defaulting to Railpack instead of Dockerfile) that previously caused hours of 502/fallback debugging on this project.
- `hermes-audit-debug`: use whenever `/api/audit` returns a fallback pack, a 502, or any Hermes-related error. Checklist starts with `GET /debug/hermes-check` on the Hermes backend before digging into logs.

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

# [shopify-product-page-optimizer] recent context, 2026-07-24 4:54am GMT+5:30

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 22 obs (7,993t read) | 163,311t work | 95% savings

### Jul 17, 2026
630 10:39p 🔵 Shopify Product Page Optimizer — V1 Build Status Snapshot
631 " 🔵 Shopify Product Page Optimizer — Project Rules and Lessons
632 " ⚖️ CEO Review Completed — V1 Wedge Redefined as Paste-Ready PDP Upgrade Pack
634 10:40p ✅ CEO Review Changes Committed to Git
### Jul 18, 2026
637 5:35p 🔵 Codex task suggestion request for Shopify Product Page Optimizer project
639 " 🔵 Shopify Product Page Optimizer — 3-commit git history confirms UI implementation complete
640 " 🔵 Shopify Product Page Optimizer — detailed build state with 3 critical blockers identified
641 " 🔵 Dodo checkout and webhook endpoints fully coded but blocked by 401 credential mismatch and unconfigured frontend redirect
642 5:36p 🔵 Frontend "Unlock full pack" button missing — Dodo checkout call not wired in src/main.js
### Jul 23, 2026
677 10:36p ⚖️ Runtime Operator Agent Alternatives to Claude/OpenAI APIs
S1024 Runtime Operator Evaluation — Alternatives to Hermes Agent and Claude/OpenAI APIs for AllSocialChannels/Shopify PDP Optimizer (Jul 23 at 10:36 PM)
### Jul 24, 2026
679 12:03a 🔵 Vercel Build Configuration — Deploy Command Visibility Issue
681 3:54a ✅ AllSocialChannels — Successful Deployment to Production
683 4:08a 🔵 Cloudflare Pages — No "Retry Deployment" Button Visible in UI
685 " 🔵 Cloudflare Pages — Retry Deployment Available via API, Not Always in Dashboard UI
686 4:14a ✅ AllSocialChannels — Build Completed Successfully
688 4:20a 🔵 User Frustration — Misunderstanding of Token/Auth Setup Between Render and Cloudflare Pages
689 " ✅ lessons.md Updated — Deployment Instruction Quality Rule Added
691 4:25a 🔵 AllSocialChannels — Upstream URL Must Match Render's Configured URL in Cloudflare Pages
692 4:26a 🔵 Shopify PDP Optimizer — Render Health Endpoint Inaccessible (Non-Retryable Error)
693 4:41a ✅ AllSocialChannels — Build Deployed Successfully
695 4:45a 🔵 Shopify PDP Optimizer — Root Path Returns "Method Not Allowed" on Render
697 4:46a 🔵 Cloudflare Pages — *.pages.dev Subdomain Cannot Be Renamed; Custom Domain Is the Only Path

Access 163k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
