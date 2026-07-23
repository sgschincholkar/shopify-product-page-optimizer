import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const skillRoot = new URL('../hermes-skills/shopify-pdp-upgrade-audit/', import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, skillRoot), 'utf8');
}

test('Hermes Shopify PDP skill defines the complete controlled audit workflow', async () => {
  const skill = await read('SKILL.md');

  assert.match(skill, /^---\nname: shopify-pdp-upgrade-audit\n/m);
  assert.match(skill, /Use when .*Shopify product page/i);
  assert.match(skill, /competitor comparability/i);
  assert.match(skill, /evidence/i);
  assert.match(skill, /fallback/i);
  assert.match(skill, /unsupported claims/i);
  assert.match(skill, /JSON only/i);
  assert.match(skill, /references\/seo-rules\.md/);
  assert.match(skill, /references\/conversion-rules\.md/);
  assert.match(skill, /references\/copywriting-rules\.md/);
  assert.match(skill, /references\/output-contract\.md/);
});

test('skill references preserve PDP-specific SEO, conversion, and copy rules', async () => {
  const [seo, conversion, copy] = await Promise.all([
    read('references/seo-rules.md'),
    read('references/conversion-rules.md'),
    read('references/copywriting-rules.md'),
  ]);

  for (const required of ['meta title', 'meta description', 'search intent', 'keyword stuffing', 'heading', 'image alt']) {
    assert.match(seo, new RegExp(required, 'i'));
  }
  for (const required of ['value proposition', 'benefit', 'trust signal', 'objection', 'friction', 'FAQ']) {
    assert.match(conversion, new RegExp(required, 'i'));
  }
  for (const required of ['clarity over cleverness', 'benefits over features', 'customer language', 'active voice', 'honest', 'specific']) {
    assert.match(copy, new RegExp(required, 'i'));
  }
});

test('output contract requires evidence-backed deliverables and claim safety', async () => {
  const contract = await read('references/output-contract.md');

  for (const required of [
    'originalTitle',
    'newTitle',
    'description',
    'bullets',
    'faqs',
    'trustCopy',
    'metaTitle',
    'metaDescription',
    'keyTerms',
    'imageRecommendations',
    'competitorGaps',
    'evidence',
    'claimWarnings',
    'analysisMode',
  ]) {
    assert.match(contract, new RegExp(required));
  }
  assert.match(contract, /never invent/i);
  assert.match(contract, /merchant PDP|competitor/i);
});

test('Hermes adapter preloads the skill and requests the expanded contract', async () => {
  const adapter = await readFile(new URL('../scripts/hermes-audit-server.mjs', import.meta.url), 'utf8');

  assert.match(adapter, /--skills', 'shopify-pdp-upgrade-audit/);
  assert.match(adapter, /analysisMode/);
  assert.match(adapter, /competitorGaps/);
  assert.match(adapter, /claimWarnings/);
});

test('full pack renderer exposes description and keyword outputs', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

  assert.match(main, /pack\.description/);
  assert.match(main, /pack\.seo\?\.keyTerms/);
});
