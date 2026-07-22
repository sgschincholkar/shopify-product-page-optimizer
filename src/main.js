import './style.css';

const app = document.querySelector('#app');
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

app.innerHTML = `
  <header class="nav shell">
    <a class="brand" href="#top" aria-label="PDP Signal home"><span class="brand-mark">P</span><span>PDP Signal</span></a>
    <nav aria-label="Main navigation"><a href="#how">How it works</a><a href="#output">What you get</a><a class="nav-cta" href="#audit">Start an audit <span>↗</span></a></nav>
  </header>
  <main id="top">
    <section class="hero shell">
      <div class="hero-copy"><p class="eyebrow"><span class="pulse"></span> Built for Shopify founders</p><h1>Find the gaps in your<br /><em>Shopify product page.</em><br />Get the copy to fix them.</h1><p class="lede">We compare your page with 3–5 relevant competitors, uncover SEO, conversion, trust, and buyer-objection gaps, then rewrite your title, description, benefits, FAQs, and metadata.</p><div class="proof"><div class="avatars"><span>SK</span><span>MR</span><span>AJ</span></div><span>Built for founders who ship fast</span></div></div>
      <div class="hero-form-wrap" id="audit"><div class="form-accent"></div>
        <form id="audit-form" class="audit-form" novalidate>
          <div class="form-heading"><span class="step">01</span><div><h2>Analyze your product page</h2><p>No Shopify access needed. Just your public product page.</p></div></div>
          <label for="url">Product page URL</label><div class="input-wrap"><span class="input-icon">↗</span><input id="url" name="url" type="url" placeholder="https://yourstore.com/products/…" required /></div>
          <label for="email">Your email (for the audit record)</label><div class="input-wrap"><span class="input-icon">@</span><input id="email" name="email" type="email" placeholder="you@yourbrand.com" required /></div>
          <p id="form-error" class="form-error hidden" role="alert"></p><button class="primary-btn" type="submit">Analyze my product page <span>→</span></button><p class="form-note"><span>◉</span> No Shopify access required</p>
        </form><div id="processing" class="result-panel hidden" aria-live="polite"></div>
      </div>
    </section>
    <section id="how" class="ticker"><div class="shell ticker-inner"><span>⌁</span> Product pages with a point of view <span>·</span> Less guesswork. More checkout clicks. <span>·</span> Product pages with a point of view</div></section>
    <section class="section shell" id="output"><div class="section-intro"><p class="eyebrow">The upgrade pack</p><h2>Everything your PDP needs<br /><em>to pull its weight.</em></h2><p>We compare your page against the patterns that make the best pages convert — then hand you copy you can paste straight into Shopify.</p></div><div class="output-grid"><article class="output-card featured"><span class="card-number">01</span><div class="card-icon">T</div><h3>Title that earns the click</h3><p>Clearer, more specific, and built around the words your customers actually search.</p><span class="card-link">Included in the audit <b>→</b></span></article><article class="output-card"><span class="card-number">02</span><div class="card-icon">✳</div><h3>Benefits over features</h3><p>5–7 bullets that turn ingredients and specs into reasons to buy now.</p><span class="card-link">Included in the audit <b>→</b></span></article><article class="output-card"><span class="card-number">03</span><div class="card-icon">?</div><h3>Objections, answered</h3><p>FAQs written in customer language, so hesitation has fewer places to hide.</p><span class="card-link">Included in the audit <b>→</b></span></article></div></section>
    <section class="quote-band"><div class="shell quote-inner"><p class="eyebrow">Why founders use it</p><blockquote>“The fastest way to see<br />what your product page<br /><em>could be saying.”</em></blockquote><p class="quote-caption">A better PDP is not a redesign.<br /><strong>It’s a better argument.</strong></p></div></section>
    <section class="bottom-cta shell"><div><p class="eyebrow">Ready when you are</p><h2>Find the gaps.<br /><em>Get the copy to fix them.</em></h2></div><a class="primary-btn" href="#audit">Analyze my product page <span>→</span></a></section>
  </main><footer class="shell footer"><span>© 2026 PDP Signal</span><span>Built for founders who care about the details.</span></footer>`;

const form = document.querySelector('#audit-form');
const processing = document.querySelector('#processing');
const formError = document.querySelector('#form-error');
const setError = (message) => { formError.textContent = message; formError.classList.toggle('hidden', !message); };

function showResult(result, email) {
  const sourceLabel = result.mode === 'hermes' || result.source === 'hermes' ? 'Hermes-generated output' : result.source === 'linkup-benchmarked-fallback' ? 'Linkup competitor preview' : 'Fallback title preview';
  const persistenceLabel = result.persistence?.status === 'saved' ? 'Audit saved' : result.persistence?.status === 'failed' ? 'Audit result ready; save is pending' : 'Preview only';
  const pack = result.fullPack;
  const competitorGaps = Array.isArray(result.competitorGaps) ? result.competitorGaps : [];
  const claimWarnings = Array.isArray(result.claimWarnings) ? result.claimWarnings : [];
  const limitations = Array.isArray(result.limitations) ? result.limitations : [];
  const discoveryQueries = Array.isArray(result.discoveryQueries) ? result.discoveryQueries : [];
  const gapHtml = competitorGaps.length ? `<div class="pack-section proof-section"><small>Competitor gaps</small><ul>${competitorGaps.slice(0, 4).map((item) => `<li><strong>${escapeHtml(item.gap || 'Gap found')}</strong>${item.impact ? ` · ${escapeHtml(item.impact)} impact` : ''}${item.recommendation ? `<br />${escapeHtml(item.recommendation)}` : ''}${Array.isArray(item.evidenceIds) && item.evidenceIds.length ? `<br /><span>Evidence: ${item.evidenceIds.map(escapeHtml).join(', ')}</span>` : ''}</li>`).join('')}</ul></div>` : '';
  const warningHtml = claimWarnings.length ? `<div class="pack-section proof-section"><small>Claims to verify</small><ul>${claimWarnings.slice(0, 5).map((item) => `<li><strong>${escapeHtml(item.proposedClaim || 'Claim')}</strong>${item.reason ? `<br />${escapeHtml(item.reason)}` : ''}${item.proofNeeded ? `<br /><span>Proof needed: ${escapeHtml(item.proofNeeded)}</span>` : ''}</li>`).join('')}</ul></div>` : '';
  const limitationHtml = limitations.length ? `<div class="pack-section proof-section"><small>Audit limitations</small><ul>${limitations.slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : '';
  const queryHtml = discoveryQueries.length ? `<div class="pack-section proof-section"><small>Competitor searches used</small><ul>${discoveryQueries.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : '';
  const packHtml = pack ? `<section class="full-pack"><div class="pack-section"><small>Benefits-first bullets</small><ul>${(pack.bullets || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div><div class="pack-section"><small>FAQ draft</small><div class="faq-list">${(pack.faqs || []).map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</div></div><div class="pack-section"><small>Trust copy</small><p>${escapeHtml(pack.trustCopy || '')}</p></div><div class="pack-grid"><div><small>SEO meta title</small><p>${escapeHtml(pack.seo?.metaTitle || '')}</p></div><div><small>SEO description</small><p>${escapeHtml(pack.seo?.metaDescription || '')}</p></div></div><div class="pack-section"><small>Image recommendations</small><ul>${(pack.imageRecommendations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div></section>` : '';
  processing.innerHTML = `<p class="eyebrow success-label">Upgrade pack ready</p><h2>Same product.<br /><em>Sharper promise.</em></h2><div class="comparison"><div><small>Current title</small><p>${escapeHtml(result.originalTitle)}</p></div><div class="arrow">→</div><div class="new-title"><small>Your upgraded title</small><p>${escapeHtml(result.newTitle)}</p></div></div>${gapHtml}${packHtml}${warningHtml}${limitationHtml}${queryHtml}<p class="form-note"><span>✓</span> Payment-free v1 audit generated for ${escapeHtml(email)}. The complete pack is ready to use.</p><p class="audit-source"><strong>${escapeHtml(sourceLabel)}</strong> · ${escapeHtml(persistenceLabel)}${result.analysisMode ? ` · ${escapeHtml(result.analysisMode)}` : ''}<br />${escapeHtml(result.note || 'Upgrade pack generated from your product page.')}</p>`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); setError('');
  const data = new FormData(form); const productUrl = String(data.get('url') || '').trim(); const email = String(data.get('email') || '').trim();
  if (!form.checkValidity()) { setError('Enter a valid product URL and email address.'); form.reportValidity(); return; }
  form.classList.add('hidden'); processing.classList.remove('hidden');
  processing.innerHTML = '<div class="loader"><span></span><span></span><span></span></div><p class="eyebrow">Reading your page</p><h2>Finding the strongest<br /><em>way to say it.</em></h2><p class="muted">We’re extracting the current title, comparing relevant product pages, and building the complete pack. No payment is required.</p>';
  try {
    const response = await fetch('/api/audit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productUrl, email }) });
    const raw = await response.text();
    let result;
    try { result = JSON.parse(raw); } catch { throw new Error('The audit service returned an invalid response. Try again.'); }
    if (!response.ok) throw new Error(result.error || 'Audit failed. Try again.');
    showResult(result, email);
  } catch (error) {
    form.classList.remove('hidden'); processing.classList.add('hidden'); setError(error.message || 'We could not process that page. Try again.');
  }
});
