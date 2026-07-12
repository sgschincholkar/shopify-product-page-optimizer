import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const http = httpRouter();

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

http.route({
  path: '/api/audit',
  method: 'OPTIONS',
  handler: httpAction(async () => response({ ok: true })),
});

http.route({
  path: '/api/audit',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return response({ error: 'Invalid JSON payload.' }, 400);
    }
    try {
      if (body.operation === 'saveFreeAudit') {
        return response(await ctx.runMutation(api.audits.saveFreeAudit, body.audit));
      }
      if (body.operation === 'markAuditPaid') {
        return response(await ctx.runMutation(api.audits.markAuditPaid, body.audit));
      }
      return response({ error: 'Unknown operation.' }, 400);
    } catch (error) {
      return response({ error: error.message || 'Convex operation failed.' }, 400);
    }
  }),
});

export default http;
