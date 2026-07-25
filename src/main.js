import './style.css';
import { scoreAudit } from './audit-core.js';

const app = document.querySelector('#app');
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const copyPayloads = new Map();
let copyId = 0;
let lastAudit = null; // { result, email, productUrl } — kept for a same-session refresh of the report route.

app.innerHTML = `
  <div id="landing">
    <header class="nav shell">
      <a class="brand" href="#top" aria-label="PDP Signal home"><span class="brand-mark">P</span><span>PDP Signal</span></a>
      <nav aria-label="Main navigation"><a href="#how">How it works</a><a href="#output">What you get</a><a class="nav-cta" href="#audit">Start an audit <span>↗</span></a></nav>
    </header>
    <main id="top">
      <section class="hero shell">
        <div class="hero-copy"><p class="eyebrow"><span class="pulse"></span> Built for Shopify founders</p><h1>Find the gaps in your<br /><em>Shopify product page.</em><br />Get the copy to fix them.</h1><p class="lede">We compare your page with 3–5 relevant competitors, uncover SEO, conversion, trust, and buyer-objection gaps, then rewrite your title, description, benefits, FAQs, and metadata.</p><div class="proof"><span class="proof-icon">✓</span><span>Built for founders who ship fast</span></div></div>
        <div class="hero-form-wrap" id="audit"><div class="form-accent"></div>
          <form id="audit-form" class="audit-form" novalidate>
            <div class="form-heading"><span class="step">01</span><div><h2>Analyze your product page</h2><p>No Shopify access needed. Just your public product page.</p></div></div>
            <label for="url">Product page URL</label><div class="input-wrap"><span class="input-icon">↗</span><input id="url" name="url" type="url" placeholder="https://yourstore.com/products/…" required /></div>
            <label for="email">Your email (for the audit record)</label><div class="input-wrap"><span class="input-icon">@</span><input id="email" name="email" type="email" placeholder="you@yourbrand.com" required /></div>
            <p id="form-error" class="form-error hidden" role="alert"></p><button class="primary-btn" type="submit">Analyze my product page <span>→</span></button><p class="form-note"><span>◉</span> No Shopify access required</p>
          </form>
        </div>
      </section>
      <section id="how" class="ticker"><div class="shell ticker-inner"><span>⌁</span> Product pages with a point of view <span>·</span> Less guesswork. More checkout clicks. <span>·</span> Product pages with a point of view</div></section>
      <section class="section shell" id="output"><div class="section-intro"><p class="eyebrow">The upgrade pack</p><h2>Everything your PDP needs<br /><em>to pull its weight.</em></h2><p>We compare your page against the patterns that make the best pages convert — then hand you copy you can paste straight into Shopify.</p></div><div class="output-grid"><article class="output-card featured"><span class="card-number">01</span><div class="card-icon">T</div><h3>Title that earns the click</h3><p>Clearer, more specific, and built around the words your customers actually search.</p><span class="card-link">Included in the audit <b>→</b></span></article><article class="output-card"><span class="card-number">02</span><div class="card-icon">✳</div><h3>Benefits over features</h3><p>5–7 bullets that turn ingredients and specs into reasons to buy now.</p><span class="card-link">Included in the audit <b>→</b></span></article><article class="output-card"><span class="card-number">03</span><div class="card-icon">?</div><h3>Objections, answered</h3><p>FAQs written in customer language, so hesitation has fewer places to hide.</p><span class="card-link">Included in the audit <b>→</b></span></article></div></section>
      <section class="quote-band"><div class="shell quote-inner"><p class="eyebrow">Why founders use it</p><blockquote>“The fastest way to see<br />what your product page<br /><em>could be saying.”</em></blockquote><p class="quote-caption">A better PDP is not a redesign.<br /><strong>It’s a better argument.</strong></p></div></section>
      <section class="bottom-cta shell"><div><p class="eyebrow">Ready when you are</p><h2>Find the gaps.<br /><em>Get the copy to fix them.</em></h2></div><a class="primary-btn" href="#audit">Analyze my product page <span>→</span></a></section>
    </main>
    <footer class="shell footer"><span>© 2026 PDP Signal</span><span>Built for founders who care about the details.</span></footer>
  </div>
  <div id="report" class="report-view hidden" aria-live="polite" tabindex="-1"></div>
`;

const landing = document.querySelector('#landing');
const report = document.querySelector('#report');
const form = document.querySelector('#audit-form');
const formError = document.querySelector('#form-error');
const setError = (message) => { formError.textContent = message; formError.classList.toggle('hidden', !message); };
const copyControl = (value, label) => {
  const id = `copy-${++copyId}`;
  copyPayloads.set(id, String(value || ''));
  return `<button class="copy-btn" type="button" data-copy-id="${id}" aria-label="Copy ${escapeHtml(label)}" title="Copy ${escapeHtml(label)}">Copy</button>`;
};

/* ------------------------------------------------------------------ */
/* Routing — landing at "/", report at "/report/:auditId".             */
/* State lives in memory only; a hard refresh on a report URL falls    */
/* back to the landing page rather than 404ing (see public/_redirects  */
/* for the SPA fallback that makes direct loads reach index.html).     */
/* ------------------------------------------------------------------ */
function showView(name) {
  landing.classList.toggle('hidden', name !== 'landing');
  report.classList.toggle('hidden', name === 'landing');
}

function goToLanding(replace = false) {
  if (location.pathname !== '/') {
    (replace ? history.replaceState : history.pushState).call(history, {}, '', '/');
  }
  showView('landing');
  report.innerHTML = '';
}

function goToReport(auditId, { replace = false } = {}) {
  const path = `/report/${encodeURIComponent(auditId)}`;
  if (location.pathname !== path) {
    (replace ? history.replaceState : history.pushState).call(history, {}, '', path);
  }
  showView('report');
}

window.addEventListener('popstate', () => {
  if (location.pathname.startsWith('/report/') && lastAudit) {
    showView('report');
    renderResult(lastAudit.result, lastAudit.email, lastAudit.productUrl);
  } else {
    showView('landing');
  }
});

function focusReport() {
  report.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function reportBar(productUrl, { showNav = false } = {}) {
  const nav = showNav ? `<nav class="report-jump" aria-label="Report sections"><a href="#report-gaps">Gaps</a><a href="#report-pack">Pack</a><a href="#report-notes">Notes</a></nav>` : '';
  return `<div class="report-bar shell"><button type="button" class="report-back" id="report-back">← New audit</button>${nav}<span class="report-url">${escapeHtml(productUrl || '')}</span></div>`;
}

/* ------------------------------------------------------------------ */
/* Loading — staged text through the phases a real audit goes through, */
/* since the call regularly takes 30s+.                                */
/* ------------------------------------------------------------------ */
const LOADING_STAGES = [
  { eyebrow: 'Reading your page', title: 'Pulling your current<br /><em>title and copy.</em>' },
  { eyebrow: 'Scanning competitors', title: 'Finding the strongest<br /><em>comparable product pages.</em>' },
  { eyebrow: 'Writing your pack', title: 'Turning gaps into<br /><em>copy you can paste in.</em>' },
];
let loadingTimer = null;

function showLoading(productUrl) {
  // pushState here (not replace) so the back button returns to landing;
  // the result/error states that follow replace this same entry since
  // they're the outcome of the same submission, not a new navigation.
  goToReport('pending');
  let stage = 0;
  const render = () => {
    const { eyebrow, title } = LOADING_STAGES[stage];
    report.innerHTML = `${reportBar(productUrl)}<div class="shell loading-view"><div class="loader"><span></span><span></span><span></span></div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2>${title}</h2><p class="muted">No payment is required. This usually takes under a minute.</p></div>`;
  };
  render();
  focusReport();
  clearInterval(loadingTimer);
  loadingTimer = setInterval(() => {
    stage = Math.min(stage + 1, LOADING_STAGES.length - 1);
    render();
  }, 6000);
}

/* ------------------------------------------------------------------ */
/* Error + partial states                                              */
/* ------------------------------------------------------------------ */
function showErrorState(message, productUrl) {
  clearInterval(loadingTimer);
  const safeMessage = message || 'We could not process that page. Try again.';
  report.innerHTML = `${reportBar(productUrl)}<div class="shell error-view">
    <p class="eyebrow error-label">✕ Audit failed</p>
    <h2>That page didn't come back<br /><em>with a usable result.</em></h2>
    <p class="muted">${escapeHtml(safeMessage)}</p>
    <button type="button" class="primary-btn" id="report-retry">Try again <span>→</span></button>
  </div>`;
  goToReport('error', { replace: true });
  focusReport();
  const urlField = document.querySelector('#url');
  if (urlField && productUrl) urlField.value = productUrl;
}

function citationList(gaps, evidenceById) {
  if (!gaps.length) return '';
  const items = gaps.map((gap) => {
    const ids = Array.isArray(gap.evidenceIds) ? gap.evidenceIds : [];
    const notes = ids.map((id) => evidenceById.get(id)).filter(Boolean);
    if (!notes.length) return '';
    return notes.map((note) => escapeHtml(note.observation || note.sourceType || String(note))).join('; ');
  }).filter(Boolean);
  return items.length ? `<p class="section-sources"><small>Sources</small> ${items.join(' · ')}</p>` : '';
}

function scoreBadge(score, band) {
  return `<span class="score-badge score-${band}" title="Heuristic score, ${score} out of 100"><b>${score}</b><i>/100</i></span>`;
}

function renderResult(result, email, productUrl) {
  copyPayloads.clear();
  const sourceLabel = result.mode === 'hermes' || result.source === 'hermes' ? 'Hermes-generated output' : result.source === 'linkup-benchmarked-fallback' ? 'Linkup competitor preview' : 'Fallback title preview';
  const persistenceLabel = result.persistence?.status === 'saved' ? 'Audit saved' : result.persistence?.status === 'failed' ? 'Audit result ready; save is pending' : 'Preview only';
  const pack = result.fullPack;
  const competitorGaps = Array.isArray(result.competitorGaps) ? result.competitorGaps : [];
  const claimWarnings = Array.isArray(result.claimWarnings) ? result.claimWarnings : [];
  const limitations = Array.isArray(result.limitations) ? result.limitations : [];
  const discoveryQueries = Array.isArray(result.discoveryQueries) ? result.discoveryQueries : [];
  const competitors = Array.isArray(result.competitors) ? result.competitors : [];
  const evidence = Array.isArray(result.evidence) ? result.evidence : [];
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));

  const scored = scoreAudit(result);
  const scoreById = new Map(scored.sections.map((section) => [section.id, section]));

  const gapHtml = competitorGaps.length ? `<div class="proof-section"><small>Competitor gaps</small><ul>${competitorGaps.slice(0, 4).map((item) => `<li><strong>${escapeHtml(item.gap || 'Gap found')}</strong>${item.impact ? ` · ${escapeHtml(item.impact)} impact` : ''}${item.recommendation ? `<br />${escapeHtml(item.recommendation)}` : ''}${Array.isArray(item.evidenceIds) && item.evidenceIds.length ? `<br /><span>Evidence: ${item.evidenceIds.map(escapeHtml).join(', ')}</span>` : ''}</li>`).join('')}</ul></div>` : '';
  const warningHtml = claimWarnings.length ? `<div class="proof-section warn"><small>Claims to verify</small><ul>${claimWarnings.slice(0, 5).map((item) => `<li><strong>${escapeHtml(item.proposedClaim || 'Claim')}</strong>${item.reason ? `<br />${escapeHtml(item.reason)}` : ''}${item.proofNeeded ? `<br /><span>Proof needed: ${escapeHtml(item.proofNeeded)}</span>` : ''}</li>`).join('')}</ul></div>` : '';
  const limitationHtml = limitations.length ? `<div class="proof-section"><small>Audit limitations</small><ul>${limitations.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : '';
  const queryHtml = discoveryQueries.length ? `<div class="proof-section"><small>Competitor searches used</small><ul>${discoveryQueries.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : '';
  const competitorHtml = competitors.length ? `<div class="proof-section"><small>Competitor pages compared</small><ul>${competitors.slice(0, 5).map((item) => { const url = typeof item === 'string' ? item : item.url; return url ? `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>` : ''; }).join('')}</ul></div>` : '';

  const faqCopy = (pack?.faqs || []).map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');
  const bulletsCopy = (pack?.bullets || []).map((item) => `- ${item}`).join('\n');
  const wholePackCopy = pack ? [
    `TITLE\n${result.newTitle}`,
    `DESCRIPTION\n${pack.description || ''}`,
    `BENEFITS\n${bulletsCopy}`,
    `FAQS\n${faqCopy}`,
    `TRUST COPY\n${pack.trustCopy || ''}`,
    `SEO\nMeta title: ${pack.seo?.metaTitle || ''}\nMeta description: ${pack.seo?.metaDescription || ''}\nKeywords: ${(pack.seo?.keyTerms || []).join(', ')}`,
  ].join('\n\n') : '';

  // Per-section gaps come from scoreAudit's own keyword match against
  // SECTION_DEFINITIONS, so each section already knows which of the
  // audit's competitorGaps apply to it — no separate lookup needed here.
  function sectionShell(id, label, bodyHtml) {
    const info = scoreById.get(id);
    const sources = citationList(info?.gaps || [], evidenceById);
    const noSourceNote = !sources && evidence.length === 0
      ? `<p class="section-sources muted-note">No competitor sources available for this audit — generated from your page only.</p>`
      : '';
    return `
      <section class="pack-section" id="report-pack-${id}">
        <header class="pack-section-head"><h3>${escapeHtml(label)}</h3>${info ? scoreBadge(info.score, info.band) : ''}</header>
        <div class="pack-section-body">${bodyHtml}</div>
        ${sources}${noSourceNote}
      </section>`;
  }

  const packHtml = pack ? `
    <div class="report-section-head" id="report-pack"><p class="eyebrow">The upgrade pack</p></div>
    ${sectionShell('description', 'Product description', `<div class="pack-heading">${copyControl(pack.description, 'product description')}</div><p>${escapeHtml(pack.description || '')}</p>`)}
    ${sectionShell('benefits', 'Benefits-first bullets', `<div class="pack-heading">${copyControl(bulletsCopy, 'benefit bullets')}</div><ul>${(pack.bullets || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)}
    ${sectionShell('faqs', 'FAQ draft', `<div class="pack-heading">${copyControl(faqCopy, 'FAQs')}</div><div class="faq-list">${(pack.faqs || []).map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</div>`)}
    ${sectionShell('trust', 'Trust copy', `<div class="pack-heading">${copyControl(pack.trustCopy, 'trust copy')}</div><p>${escapeHtml(pack.trustCopy || '')}</p>`)}
    ${sectionShell('images', 'Image recommendations', `<ul>${(pack.imageRecommendations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)}
    ${sectionShell('seo', 'SEO metadata', `
        <div class="pack-heading">${copyControl(`${pack.seo?.metaTitle || ''}\n${pack.seo?.metaDescription || ''}`, 'SEO metadata')}</div>
        <div class="pack-grid-inner">
          <div><div class="pack-heading"><small>Meta title</small></div><p>${escapeHtml(pack.seo?.metaTitle || '')}</p></div>
          <div><div class="pack-heading"><small>Meta description</small></div><p>${escapeHtml(pack.seo?.metaDescription || '')}</p></div>
        </div>
        <div class="pack-keywords"><div class="pack-heading"><small>Search keywords</small></div><p>${(pack.seo?.keyTerms || []).map((item) => escapeHtml(item)).join(', ')}</p></div>
      `)}
    ${(warningHtml || limitationHtml || queryHtml || competitorHtml) ? `<div class="report-section-head" id="report-notes"><p class="eyebrow">Notes on this audit</p></div>` : ''}
    ${warningHtml}${limitationHtml}${competitorHtml}${queryHtml}
  ` : `
    <div class="proof-section warn" id="report-pack"><small>Partial result</small><p>We generated your upgraded title, but the full copy pack didn't come back this time. Your title upgrade below is still ready to use — try running the audit again for the complete pack.</p></div>
  `;

  const overallBadge = `<div class="score-strip"><div class="score-strip-main">${scoreBadge(scored.overall, scored.band)}<div><small>Overall PDP score</small><p>${scored.gapCount} gap${scored.gapCount === 1 ? '' : 's'} found · ${scored.warningCount} claim${scored.warningCount === 1 ? '' : 's'} to verify</p></div></div><p class="score-strip-note">Heuristic score from this audit's gaps and coverage — not yet Hermes-generated.</p></div>`;

  report.innerHTML = `${reportBar(productUrl, { showNav: true })}<div class="shell report-body">
    <div class="report-head"><p class="eyebrow success-label">✓ Upgrade pack ready</p><h2>Same product. <em>Sharper promise.</em></h2></div>
    ${overallBadge}
    <div class="comparison">
      <div><small>Current title</small><p>${escapeHtml(result.originalTitle)}</p></div>
      <div class="arrow">→</div>
      <div class="new-title"><div class="pack-heading"><small>Your upgraded title</small>${copyControl(result.newTitle, 'upgraded title')}</div><p>${escapeHtml(result.newTitle)}</p></div>
    </div>
    ${gapHtml ? `<div class="report-section-head" id="report-gaps"><p class="eyebrow">Where you're losing shoppers</p></div>${gapHtml}` : ''}
    ${pack ? `<div class="pack-toolbar">${copyControl(wholePackCopy, 'the entire pack')}<span>Copy everything at once</span></div>` : ''}
    ${packHtml}
    <div class="report-footer">
      <p class="form-note"><span>✓</span> Payment-free v1 audit generated for ${escapeHtml(email)}. The complete pack is ready to use.</p>
      <p class="audit-source"><strong>${escapeHtml(sourceLabel)}</strong> · ${escapeHtml(persistenceLabel)}${result.analysisMode ? ` · ${escapeHtml(result.analysisMode)}` : ''}<br />${escapeHtml(result.note || 'Upgrade pack generated from your product page.')}</p>
    </div>
  </div>`;
}

function showResult(result, email, productUrl) {
  clearInterval(loadingTimer);
  lastAudit = { result, email, productUrl };
  renderResult(result, email, productUrl);
  goToReport(result.auditId || 'result', { replace: true });
  focusReport();
}

report.addEventListener('click', async (event) => {
  const backBtn = event.target.closest('#report-back');
  if (backBtn) { goToLanding(); return; }
  const retryBtn = event.target.closest('#report-retry');
  if (retryBtn) { goToLanding(); return; }
  const button = event.target.closest('[data-copy-id]');
  if (!button) return;
  const value = copyPayloads.get(button.dataset.copyId) || '';
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  const original = button.textContent;
  button.textContent = 'Copied';
  button.classList.add('copied');
  setTimeout(() => { button.textContent = original; button.classList.remove('copied'); }, 1400);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault(); setError('');
  const data = new FormData(form); const productUrl = String(data.get('url') || '').trim(); const email = String(data.get('email') || '').trim();
  if (!form.checkValidity()) { setError('Enter a valid product URL and email address.'); form.reportValidity(); return; }
  showLoading(productUrl);
  try {
    const response = await fetch('/api/audit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productUrl, email }) });
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); } catch { throw new Error('The audit service returned an invalid response. Try again.'); }
    if (!response.ok) throw new Error(result.error || 'Audit failed. Try again.');
    showResult(result, email, productUrl);
  } catch (error) {
    showErrorState(error.message, productUrl);
  }
});

/* Restore report view on a same-session deep link (e.g. browser back/forward). */
if (location.pathname.startsWith('/report/') && lastAudit) {
  showView('report');
  renderResult(lastAudit.result, lastAudit.email, lastAudit.productUrl);
} else if (location.pathname.startsWith('/report/')) {
  history.replaceState({}, '', '/');
}
