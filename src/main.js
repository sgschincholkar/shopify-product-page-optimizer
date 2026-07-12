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
      <div class="hero-copy"><p class="eyebrow"><span class="pulse"></span> Built for Shopify founders</p><h1>Your product page is<br /><em>leaving sales behind.</em></h1><p class="lede">Paste your Shopify URL. Get a sharper, competitor-benchmarked upgrade pack in 90 seconds — starting with a free title rewrite.</p><div class="proof"><div class="avatars"><span>SK</span><span>MR</span><span>AJ</span></div><span>Built for founders who ship fast</span></div></div>
      <div class="hero-form-wrap" id="audit"><div class="form-accent"></div>
        <form id="audit-form" class="audit-form" novalidate>
          <div class="form-heading"><span class="step">01</span><div><h2>Get your free title rewrite</h2><p>No Shopify access needed. Just your public product page.</p></div></div>
          <label for="url">Product page URL</label><div class="input-wrap"><span class="input-icon">↗</span><input id="url" name="url" type="url" placeholder="https://yourstore.com/products/…" required /></div>
          <label for="email">Where should we send your upgrade?</label><div class="input-wrap"><span class="input-icon">@</span><input id="email" name="email" type="email" placeholder="you@yourbrand.com" required /></div>
          <p id="form-error" class="form-error hidden" role="alert"></p><button class="primary-btn" type="submit">Get my free title <span>→</span></button><p class="form-note"><span>◉</span> Takes about 90 seconds · No credit card</p>
        </form><div id="processing" class="result-panel hidden" aria-live="polite"></div>
      </div>
    </section>
    <section id="how" class="ticker"><div class="shell ticker-inner"><span>⌁</span> Product pages with a point of view <span>·</span> Less guesswork. More checkout clicks. <span>·</span> Product pages with a point of view</div></section>
    <section class="section shell" id="output"><div class="section-intro"><p class="eyebrow">The upgrade pack</p><h2>Everything your PDP needs<br /><em>to pull its weight.</em></h2><p>We compare your page against the patterns that make the best pages convert — then hand you copy you can paste straight into Shopify.</p></div><div class="output-grid"><article class="output-card featured"><span class="card-number">01</span><div class="card-icon">T</div><h3>Title that earns the click</h3><p>Clearer, more specific, and built around the words your customers actually search.</p><span class="card-link">Free preview <b>→</b></span></article><article class="output-card"><span class="card-number">02</span><div class="card-icon">✳</div><h3>Benefits over features</h3><p>5–7 bullets that turn ingredients and specs into reasons to buy now.</p><span class="card-link">In the full pack <b>→</b></span></article><article class="output-card"><span class="card-number">03</span><div class="card-icon">?</div><h3>Objections, answered</h3><p>FAQs written in customer language, so hesitation has fewer places to hide.</p><span class="card-link">In the full pack <b>→</b></span></article></div></section>
    <section class="quote-band"><div class="shell quote-inner"><p class="eyebrow">Why founders use it</p><blockquote>“The fastest way to see<br />what your product page<br /><em>could be saying.”</em></blockquote><p class="quote-caption">A better PDP is not a redesign.<br /><strong>It’s a better argument.</strong></p></div></section>
    <section class="bottom-cta shell"><div><p class="eyebrow">Ready when you are</p><h2>Give your best product<br /><em>a better argument.</em></h2></div><a class="primary-btn" href="#audit">Start with a free title <span>→</span></a></section>
  </main><footer class="shell footer"><span>© 2026 PDP Signal</span><span>Built for founders who care about the details.</span></footer>`;

const form = document.querySelector('#audit-form');
const processing = document.querySelector('#processing');
const formError = document.querySelector('#form-error');
const setError = (message) => { formError.textContent = message; formError.classList.toggle('hidden', !message); };

function showResult(result, email) {
  const sourceLabel = result.source === 'hermes' ? 'Hermes benchmarked title' : 'Fallback title preview';
  const persistenceLabel = result.persistence?.status === 'saved' ? 'Audit saved' : result.persistence?.status === 'failed' ? 'Audit result ready; save is pending' : 'Preview only';
  processing.innerHTML = `<p class="eyebrow success-label">Title upgrade ready</p><h2>Same product.<br /><em>Sharper promise.</em></h2><div class="comparison"><div><small>Current title</small><p>${escapeHtml(result.originalTitle)}</p></div><div class="arrow">→</div><div class="new-title"><small>Your upgraded title</small><p>${escapeHtml(result.newTitle)}</p></div></div><button class="primary-btn" type="button" id="unlock">Unlock full pack · $19 <span>→</span></button><p class="form-note"><span>✓</span> Full pack delivery to ${escapeHtml(email)} comes after checkout.</p><p class="audit-source"><strong>${escapeHtml(sourceLabel)}</strong> · ${escapeHtml(persistenceLabel)}<br />${escapeHtml(result.note || 'Free title generated from your product page.')}</p>`;
  document.querySelector('#unlock').addEventListener('click', () => {
    alert('Dodo checkout is the next integration. No payment was taken.');
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); setError('');
  const data = new FormData(form); const productUrl = String(data.get('url') || '').trim(); const email = String(data.get('email') || '').trim();
  if (!form.checkValidity()) { setError('Enter a valid product URL and email address.'); form.reportValidity(); return; }
  form.classList.add('hidden'); processing.classList.remove('hidden');
  processing.innerHTML = '<div class="loader"><span></span><span></span><span></span></div><p class="eyebrow">Reading your page</p><h2>Finding the strongest<br /><em>way to say it.</em></h2><p class="muted">We’re extracting the current title. Competitor benchmarking runs when the Hermes audit service is configured.</p>';
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
