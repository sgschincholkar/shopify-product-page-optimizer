import { auditRequest } from '../../src/audit-core.js';

export async function onRequestPost(context) {
  return auditRequest(context.request, context.env);
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
    status: 405,
    headers: { 'content-type': 'application/json' },
  });
}

export default { onRequest };
