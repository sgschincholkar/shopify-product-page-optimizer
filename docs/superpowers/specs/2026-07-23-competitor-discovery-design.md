# Automatic Competitor Discovery Design

## Goal

Improve V1 competitor discovery without adding a vertical-hint field to the customer form. The system should infer the merchant brand, product type, category, and buyer/use-case language from the public PDP, then use those signals to search for comparable competitor product pages.

## Design

The adapter will extend `extractPdpContext()` with normalized `brand`, `productType`, and `searchTerms` fields. Brand detection will prefer JSON-LD Product/Organization data and fall back to Open Graph metadata, page metadata, and the product URL hostname. Search terms will be derived from the title, headings, description, and structured data without copying long page text into a query.

Competitor discovery will issue a small set of focused Linkup searches. Queries will be category-led, for example `dark roast coffee high caffeine competitors`, rather than brand-led. The merchant hostname and normalized brand will be used as exclusion signals. Results will retain their source query so Hermes and the UI can distinguish evidence from different searches.

The existing `verticalHint` remains accepted for API callers and is treated as an optional additional category signal. The frontend remains URL plus email only.

## Boundaries and limitations

- No browser automation or JavaScript rendering is added in this change.
- No payment, email, Shopify admin, or deployment behavior changes.
- Search-result snippets remain candidate evidence; Hermes still decides comparability and must mark limited evidence.
- The system must never use the merchant brand as proof of a competitor relationship.

## Verification

- Unit tests cover brand extraction, inferred search terms, query construction, merchant-domain exclusion, and query provenance.
- Existing tests, build, and a local audit are run after implementation.
