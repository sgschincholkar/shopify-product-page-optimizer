import { mutation } from './_generated/server';
import { v } from 'convex/values';

const competitorValidator = v.any();

export const saveFreeAudit = mutation({
  args: {
    auditId: v.string(),
    productUrl: v.string(),
    userEmail: v.string(),
    status: v.union(v.literal('free_done'), v.literal('full_pack_ready'), v.literal('paid')),
    originalTitle: v.string(),
    newTitle: v.string(),
    competitors: v.array(competitorValidator),
    fullPackJson: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const domain = new URL(args.productUrl).hostname.toLowerCase();
    const existingStore = await ctx.db.query('stores').withIndex('by_domain', (q) => q.eq('domain', domain)).unique();
    const storeId = existingStore?._id ?? await ctx.db.insert('stores', {
      domain,
      brandVoiceTags: [],
      bannedClaims: [],
      createdAt: now,
      updatedAt: now,
    });
    if (existingStore) await ctx.db.patch(existingStore._id, { updatedAt: now });

    const existingAudit = await ctx.db.query('audits').filter((q) => q.eq(q.field('externalAuditId'), args.auditId)).first();
    const record = {
      storeId,
      productUrl: args.productUrl,
      userEmail: args.userEmail,
      status: args.status,
      originalTitle: args.originalTitle,
      newTitle: args.newTitle,
      competitors: args.competitors,
      fullPackJson: args.fullPackJson,
      createdAt: existingAudit?.createdAt ?? now,
      updatedAt: now,
      externalAuditId: args.auditId,
    };
    const auditId = existingAudit ? (await ctx.db.replace(existingAudit._id, record), existingAudit._id) : await ctx.db.insert('audits', record);
    return {
      auditId,
      externalAuditId: args.auditId,
      status: record.status,
      originalTitle: record.originalTitle,
      newTitle: record.newTitle,
      fullPackJson: record.fullPackJson,
      competitors: record.competitors,
    };
  },
});

export const markAuditPaid = mutation({
  args: {
    auditId: v.string(),
    paymentId: v.optional(v.string()),
    provider: v.literal('dodo'),
    status: v.literal('paid'),
    rawEvent: v.any(),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.query('audits').filter((q) => q.eq(q.field('externalAuditId'), args.auditId)).first();
    if (!audit) throw new Error('Audit not found.');
    const now = Date.now();
    await ctx.db.patch(audit._id, { status: 'paid', updatedAt: now });
    const existingPayment = args.paymentId
      ? await ctx.db.query('payments').withIndex('by_provider_payment', (q) => q.eq('providerPaymentId', args.paymentId)).unique()
      : null;
    if (!existingPayment) {
      await ctx.db.insert('payments', {
        auditId: audit._id,
        amount: 19,
        currency: 'USD',
        status: 'succeeded',
        provider: args.provider,
        providerPaymentId: args.paymentId,
        rawPayload: args.rawEvent,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { auditId: audit._id, externalAuditId: args.auditId, status: 'paid' };
  },
});
