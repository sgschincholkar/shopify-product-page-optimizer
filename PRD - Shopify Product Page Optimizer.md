## **1\. Product Overview**

**Product name**
Shopify Product Page Optimizer (working name).

**One-line summary**
Find the gaps in your Shopify product page. Get the copy to fix them.

**How it works**
We compare the merchant's page with 3–5 relevant competitors, uncover SEO, conversion, trust, and buyer-objection gaps, then rewrite the title, description, benefits, FAQs, and metadata.

**Core promise**

* Input: One live Shopify product page URL.
* Output: One upgrade pack informed by specific gaps found across the merchant PDP and 3–5 relevant competitor PDPs.
* No Shopify app or theme integration required; everything happens off-store.

**Primary goal for v1**
Ship a working web app and Hermes agent that can:

1. Accept a URL and email,
2. Show a **free upgraded title** after the audit completes,
3. Generate and show the **full upgrade pack** on screen without payment,
4. Run this end-to-end on real Shopify PDPs.

Payments, paid access, payment webhooks, and email delivery are explicitly deferred to v2.

---

## **2\. Target User & Use Cases**

## **Target user (persona)**

* Priya – D2C founder
  * Runs a Rs 40L/year skincare brand on Shopify.
  * Current bestseller converts at \~0.9% with ad CPCs around Rs 260\.
  * She suspects her PDP copy is weak vs top competitors.
  * She wants a fast, low-friction way to test a better product page before hiring an agency.

## **Primary use case**

* Priya pastes her **bestseller PDP URL** and her email.
* She clicks “Analyze my product page.”
* The app shows a better title, benchmarked against 3–5 competitors.
* She immediately receives a full upgrade pack on screen with:
  * Title, bullets, FAQ, trust copy, SEO fields, images-to-add suggestions.
* She copy-pastes the pack into Shopify and ships it the same day.

---

## **3\. User Journey & Flows**

## **3.1 Entry / Landing flow**

1. User lands on a single-page app hosted on Cloudflare Pages.
2. Hero section explains the promise:
   * “Find the gaps in your Shopify product page. Get the copy to fix them.”
3. Above-the-fold form collects:
   * Email
   * Shopify product URL
4. User clicks “Analyze my product page.”
5. App calls backend/Hermes to run the audit and generate the full pack.

## **3.2 Audit flow (payment-free v1)**

1. Backend triggers Hermes “audit” agent with:
   * Product URL
   * User email (for reference)
2. Hermes:
   * Loads the product page.
   * Identifies 3–5 competitor PDPs via Linkup/search.
   * Extracts copy and basic context from the product and competitors.
3. Hermes generates the improved title and complete upgrade pack in the same run.
4. App displays:
   * Original title
   * New upgraded title
   * Full copy-paste-ready upgrade pack.

## **3.3 Full pack flow (v1)**

1. Hermes generates the **full pack** during the audit request.
2. The app shows the full pack on screen for v1 validation.
3. Hermes full pack includes:
   * New title
   * 5–7 bullets (benefits-first)
   * 5–10 FAQ Q\&A pairs
   * Trust copy: claims, guarantees, badges (with “must be legally supportable” disclaimer)
   * SEO meta title & description, and key search terms
   * “Images to add” (hero, lifestyle, UGC, comparison shots)
4. The result is stored in Convex when configured. Email delivery is deferred to v2.

## **3.4 Paid flow (v2 only)**

V2 will add Dodo checkout, payment metadata, a signed payment webhook, paid audit state, and email delivery after successful payment. These are not v1 dependencies.

## **3.4 Repeat user flow & memory (later)**

* On subsequent audits for the same store/domain:
  * Hermes pulls past audits and brand profile from Convex.
  * Hermes adapts tone and structure to match prior copy.
  * Hermes flags when a new PDP’s copy drifts significantly from established brand voice or claims.

---

## **4\. Scope for v1 (Buildathon)**

## **Must-have (MVP)**

* Cloudflare Pages landing page with:
  * Hero, explanation, simple form (email \+ URL).
* Backend/API that:
  * Accepts audit requests.
  * Triggers Hermes for free title generation.
* Hermes “audit” agent that:
  * Loads the PDP and 3–5 competitor pages.
  * Generates:
    * Improved title (free).
    * Full pack shown on screen for v1 users.
* Convex backend to store:
  * Store profile (domain, brand name, basic voice tags, banned claims).
  * Each audit (URL, inputs, outputs, status).
* V2 scope, not v1: Dodo checkout, payment records, signed webhooks, and email delivery.

## **Nice-to-have (if time permits)**

* Dashboard (for founder) showing list of:
  * All audits.
  * Paid status.
  * Quick copy of upgrade pack.
* Basic analytics (count of audits, conversion to paid).
* Copy templates tuned for a first vertical (e.g., skincare/beauty).

---

## **5\. Functional Requirements**

## **5.1 Landing Page (Cloudflare Pages)**

* Simple static site with:
  * Hero: headline, subheadline, and core promise.
  * Form: email \+ product URL, validation for required fields.
  * Primary CTA: “Analyze my product page.”
* No payment or pricing CTA in v1.
* On submit:
  * Display “Processing…” state.
* Once Hermes returns the audit, show the original title, upgraded title, and complete upgrade pack.

## **5.2 Hermes Audit Agent**

**Inputs:**

* Product URL
* User email
* Optional: vertical hint (if needed later)

**Steps:**

1. **Page load & extraction**
   * Use browser tool / scraper to:
     * Load the product page.
     * Extract: title, description, bullets, price, reviews summary, images.
2. **Competitor discovery**
   * Use Linkup or search tools to find 3–5 relevant competitor PDPs.
   * Criteria: similar product keywords, same category, top organic results.
   * Extract their: title, key bullets, price, main claims, trust markers.
3. **Analysis**
   * Identify:
     * Claims competitors make that the original PDP does not.
     * Price positioning vs competitors.
     * Common objections and questions (from reviews/Q\&A).
     * Keyword and phrase patterns in titles/headlines.
4. **Content generation**
   * **Free tier output (title only):**
     * A new product title optimized for click-through and clarity, referencing competitor positioning and typical search queries.
   * **Full pack output:**
     * New title (same as free output).
     * 5–7 bullet points that emphasize outcomes/benefits, not just ingredients/features.
     * 5–10 FAQs, phrased in customer language, addressing typical objections.
     * Trust copy:
       * Suggested badges and proof elements (e.g., “dermatologist-tested”, “30-day money-back guarantee”), but always with a note that these must be legally supportable.
     * SEO:
       * Meta title and description respecting common SEO length guidelines.
       * 5–10 suggested keywords / search phrases.
     * Images to add:
       * Types of imagery (e.g., close-ups, before/after, ingredient macros, lifestyle shots) derived from competitor norms.
5. **Output formatting**
   * Return a structured JSON with all fields clearly separated and mapped to Shopify PDP fields:
     * `shopify_title`
     * `shopify_description` (can include bullets, FAQ, and trust sections)
     * `meta_title`
     * `meta_description`
     * `image_suggestions` (list of bullet points)
   * Also return human-readable, copy-paste-ready text blocks.

## **5.3 Payments (Dodo, v2 only)**

* Ability to create one-time payment link for $19 per audit.
* Frontend integration:
  * On “Unlock full pack” click, redirect to Dodo checkout.
* Webhook endpoint:
  * On successful payment, update Convex audit record to `paid = true`.
  * Trigger Hermes (if full pack not yet generated) and send email to user.

## **5.4 Backend & Storage (Convex)**

* Tables/collections:
  * **stores**
    * `id`
    * `domain`
    * `brand_name`
    * `brand_voice_tags` (e.g., playful, clinical, premium)
    * `banned_claims` (text)
    * timestamps
  * **audits**
    * `id`
    * `store_id` (FK to stores)
    * `product_url`
    * `user_email`
    * `status` (`requested`, `free_done`, `paid`, `full_pack_ready`)
    * `original_title`
    * `new_title`
    * `full_pack_json` (full structured payload)
    * timestamps
  * **payments**
    * `id`
    * `audit_id` (FK)
    * `amount`
    * `currency`
    * `status`
    * `provider` (`dodo`)
    * raw provider payload for debugging
    * timestamps
* Basic APIs:
  * `createAudit(email, product_url)`
  * `updateAuditWithFreeTitle(audit_id, new_title, original_title)`
  * `markAuditPaid(audit_id, payment_id)`
  * `saveFullPack(audit_id, full_pack_json)`

---

## **6\. Non-Functional Requirements**

* **Deployment:**
  * Frontend: Cloudflare Pages static site.
  * Backend: Convex functions \+ Hermes agent server.
* **Performance:**
  * Return a useful result within a reasonable wait for a typical PDP and clearly communicate processing state.
  * Full pack can be slightly slower but should be reasonable for live demo (ideally \<2–3 minutes total).
* **Reliability:**
  * Handle failures gracefully:
    * If competitor scraping fails, still generate a title based on the original PDP.
    * V1 does not depend on payment confirmation or email delivery.
* **Security & safety:**
  * Never suggest claims that are obviously illegal or impossible (“cures all diseases”).
  * Always add disclaimer reminding user they are responsible for legal compliance.
  * Do not require Shopify admin access or any secrets from the merchant.

---

## **7\. Demo Requirements**

* Ability to:
  1. Paste a real Shopify PDP from someone in the room.
  2. Show:
     * Original vs new title.
  3. Show the full pack on-screen without payment.
  4. Demonstrate fallback behavior when competitor discovery is unavailable.
  5. Verify the audit result is persisted in Convex when configured.

V2 demo requirements:

* Take a live $19 payment via Dodo.
* Show the full pack after payment and confirm email delivery.
