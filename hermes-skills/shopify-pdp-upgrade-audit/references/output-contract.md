# Output Contract

Return JSON only. Do not wrap it in markdown. Preserve these field names and types:

```json
{
  "analysisMode": "competitor-benchmarked | limited-competitor | merchant-only-fallback",
  "originalTitle": "string",
  "newTitle": "string under 180 characters",
  "fullPack": {
    "title": "string",
    "description": "string",
    "bullets": ["5-7 strings when evidence supports them"],
    "faqs": [{"question": "string", "answer": "string"}],
    "trustCopy": "string",
    "seo": {
      "metaTitle": "string",
      "metaDescription": "string",
      "keyTerms": ["string"]
    },
    "imageRecommendations": ["four strings"]
  },
  "competitorGaps": [
    {
      "gap": "string",
      "impact": "high | medium | low",
      "evidenceIds": ["string"],
      "recommendation": "string"
    }
  ],
  "evidence": [
    {
      "id": "string",
      "sourceType": "merchant-pdp | competitor-pdp | search-snippet",
      "sourceUrl": "string",
      "observation": "string"
    }
  ],
  "claimWarnings": [
    {
      "proposedClaim": "string",
      "reason": "string",
      "proofNeeded": "string"
    }
  ],
  "limitations": ["string"]
}
```

## Contract rules

- Never invent merchant facts, competitor facts, search volume, rankings, prices, reviews, guarantees, certifications, ingredients, specifications, or outcomes.
- Factual copy in the upgrade must be supported by the merchant PDP evidence. Competitor evidence may support a market-gap observation but never proves a merchant product claim.
- Assign stable evidence IDs and cite them from each competitor gap.
- Use `competitor-benchmarked` only with at least three genuinely comparable competitor PDPs.
- Use `limited-competitor` with one or two comparable PDPs.
- Use `merchant-only-fallback` when competitor evidence is unavailable or unusable.
- Include five FAQs and four image recommendations by default. When evidence cannot support a complete copy field, remain conservative and explain the limitation.
- Put unsupported but potentially useful claims in `claimWarnings`; do not insert them into final copy.
- Do not include analysis or commentary outside this JSON object.

