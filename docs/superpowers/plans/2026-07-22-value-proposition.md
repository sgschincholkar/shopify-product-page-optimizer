# Value Proposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved outcome-led value proposition consistently across the landing page and product documentation.

**Architecture:** This is a static copy update. `src/main.js` owns visible landing-page text, `index.html` owns metadata, and the PRD/README/agent/task files own the product contract.

**Tech Stack:** Vite, vanilla JavaScript, Markdown.

## Global Constraints

- Preserve the existing UI structure and audit behavior.
- Do not promise conversion gains, competitor outperformance, or a fixed turnaround time.
- Use the approved headline, supporting copy, and CTA verbatim on the primary landing-page surface.

---

### Task 1: Align the primary landing-page message

**Files:**
- Modify: `src/main.js`
- Modify: `index.html`

- [ ] Replace the hero headline and supporting copy with the approved message.
- [ ] Change the primary form CTA to `Analyze my product page`.
- [ ] Update the metadata description to explain the comparison and deliverables.

### Task 2: Align the product contract

**Files:**
- Modify: `PRD - Shopify Product Page Optimizer.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `tasks/todo.md`
- Modify: `tasks/lessons.md`

- [ ] Replace vague primary positioning with the approved value proposition.
- [ ] Record that competitor analysis means comparing 3-5 relevant PDPs across SEO, conversion, trust, and buyer-objection gaps.
- [ ] Preserve historical review notes as history without using them as current positioning.

### Task 3: Verify consistency

**Files:**
- Test: active source and documentation files

- [ ] Search active files for stale primary uses of `competitor-backed` and `paste-ready`.
- [ ] Run `npm run build` and expect a successful Vite production build.
- [ ] Run `git diff --check` and expect no whitespace errors.

