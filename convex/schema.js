import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  stores: defineTable({
    domain: v.string(),
    brandName: v.optional(v.string()),
    brandVoiceTags: v.array(v.string()),
    bannedClaims: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_domain', ['domain']),

  audits: defineTable({
    storeId: v.optional(v.id('stores')),
    productUrl: v.string(),
    userEmail: v.string(),
    status: v.union(
      v.literal('requested'),
      v.literal('free_done'),
      v.literal('paid'),
      v.literal('full_pack_ready'),
      v.literal('failed'),
    ),
    originalTitle: v.optional(v.string()),
    newTitle: v.optional(v.string()),
    competitors: v.array(v.any()),
    discoveryQueries: v.optional(v.array(v.string())),
    competitorGaps: v.optional(v.array(v.any())),
    evidence: v.optional(v.array(v.any())),
    claimWarnings: v.optional(v.array(v.any())),
    limitations: v.optional(v.array(v.string())),
    analysisMode: v.optional(v.string()),
    fullPackJson: v.optional(v.any()),
    externalAuditId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_product_url', ['productUrl']).index('by_email', ['userEmail']).index('by_external_audit_id', ['externalAuditId']),

  payments: defineTable({
    auditId: v.id('audits'),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    provider: v.literal('dodo'),
    providerPaymentId: v.optional(v.string()),
    rawPayload: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_audit', ['auditId']).index('by_provider_payment', ['providerPaymentId']),
});
