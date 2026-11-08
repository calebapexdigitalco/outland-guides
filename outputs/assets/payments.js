(function () {
  const form = document.getElementById('payment-preview-form');
  if (!form) return;
  const review = document.getElementById('payment-review');
  const complete = document.getElementById('payment-complete');
  const connection = document.getElementById('payment-connection');
  const formStatus = document.getElementById('payment-form-status');
  const code = document.getElementById('payment-code');
  const next = document.getElementById('finish-payment-demo');
  const lookup = document.getElementById('review-payment');
  const status = document.createElement('p');
  status.className = 'mt-5 text-sm leading-relaxed text-white/75';
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); review.append(status);
  let token = new URLSearchParams(location.hash.slice(1)).get('payment') || '';
  let configured = false, busy = false, mode = 'live';
  const params = new URLSearchParams(location.search);
  const money = cents => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(cents / 100);
  const post = (path, data) => request(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
  async function request(path, options = {}) {
    const response = await fetch('/api/stripe/' + path, {...options, cache: 'no-store', headers: {Accept: 'application/json', ...options.headers}});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(data.error || 'We could not confirm this payment. Contact Outland Guides before trying again.');
    return data;
  }
  function summary(payment) {
    const details = document.getElementById('payment-summary');
    const rows = [['Booking reference', payment.reference], ['Expedition', payment.expedition],
      ...(payment.route ? [['Route', payment.route]] : []), ['Payment type', payment.payment_type],
      [payment.mode === 'test' ? 'TEST amount · no real charge' : 'Amount due · USD', money(payment.amount)]];
    details.replaceChildren();
    rows.forEach(([label, value]) => {
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      row.className = 'flex flex-wrap justify-between gap-2 border-b border-white/10 pb-3';
      dt.className = 'text-white/55'; dd.className = 'font-bold text-white';
      dt.textContent = label; dd.textContent = value; row.append(dt, dd); details.append(row);
    });
  }
  function showForm() { review.hidden = true; complete.hidden = true; form.hidden = false; }
  async function loadPayment() {
    if (!configured || busy) return;
    token = code.value.trim(); busy = true; lookup.disabled = true; formStatus.textContent = 'Finding your agreed payment…';
    try {
      const {payment} = await post('request', {token});
      history.replaceState(null, '', location.pathname + '#payment=' + token);
      if (Number(payment.paid)) {
        form.hidden = true; review.hidden = true; complete.hidden = false;
        complete.querySelector('h3').textContent = payment.mode === 'test' ? 'Test payment received.' : 'Payment received.';
        complete.querySelector('p').textContent = money(payment.amount) + ' received for ' + payment.reference + '. This payment link cannot be charged again.';
        return;
      }
      summary(payment); form.hidden = true; complete.hidden = true; review.hidden = false;
      next.disabled = false; next.textContent = payment.mode === 'test' ? 'Continue to TEST checkout' : 'Continue to secure checkout';
      status.textContent = payment.mode === 'test' ? 'Sandbox test only. No real funds move. Use test card details only.' : 'Your amount is fixed to your confirmed proposal. Card details are collected securely by Stripe.';
      document.getElementById('payment-review-title').focus({preventScroll: true});
    } catch (error) { formStatus.textContent = error.message; }
    finally { busy = false; lookup.disabled = !configured; }
  }
  form.addEventListener('submit', event => { event.preventDefault(); loadPayment(); });
  document.getElementById('edit-payment-demo').addEventListener('click', () => { if (!busy) { showForm(); code.focus(); } });
  next.addEventListener('click', async () => {
    if (!configured || busy || !token) return;
    busy = true; next.disabled = true; status.textContent = 'Opening your secure checkout…';
    try {
      const session = await post('checkout', {token});
      const target = new URL(session.url);
      if (target.protocol !== 'https:' || target.hostname !== 'checkout.stripe.com') throw Error('Invalid checkout destination. Please contact Outland Guides.');
      location.assign(target.href);
    } catch (error) { status.textContent = error.message; busy = false; next.disabled = false; }
  });
  async function verifyReturn() {
    const session_id = params.get('session_id');
    if (!session_id || !token) { showForm(); formStatus.textContent = 'Open your private payment link to review your booking.'; return; }
    form.hidden = true; review.hidden = true; complete.hidden = false;
    const heading = complete.querySelector('h3'), message = complete.querySelector('p');
    heading.textContent = 'Checking your payment…'; message.textContent = 'Confirming the result directly with Stripe.';
    try {
      const result = await post('status', {token, session_id});
      heading.textContent = result.paid ? (mode === 'test' ? 'Test payment confirmed.' : 'Payment received. Thank you.') : 'Payment is not yet confirmed.';
      message.textContent = result.paid
        ? money(result.payment.amount) + ' received for ' + result.payment.reference + '.' + (mode === 'test' ? ' This was a sandbox test. No real money moved.' : ' Your payment is recorded against your booking. Contact us if you need help with your receipt or trip arrangements.')
        : 'Stripe has not confirmed payment. Check again or contact us before starting another payment.';
    } catch (error) { heading.textContent = 'Payment confirmation unavailable.'; message.textContent = error.message; }
    heading.focus({preventScroll: true});
  }
  document.getElementById('restart-payment-demo').addEventListener('click', () => params.has('session_id') ? verifyReturn() : loadPayment());
  async function initialize() {
    lookup.disabled = true; next.disabled = true;
    try {
      const config = await request('config'); configured = config.configured; mode = config.mode;
      document.getElementById('payment-mode').textContent = mode === 'test' ? 'Sandbox · no real charges' : 'Secure Stripe checkout';
      connection.textContent = configured
        ? (mode === 'test' ? 'Sandbox connected for testing. No real funds move.' : 'Secure checkout is ready for your confirmed booking.')
        : 'Online payments are being connected. Contact us for help with your booking; no payment has been taken.';
      lookup.disabled = !configured;
      if (configured && /^[a-f0-9]{64}$/.test(token)) {
        code.value = token;
        if (params.has('session_id')) await verifyReturn(); else await loadPayment();
      }
    } catch { connection.textContent = 'Online checkout is temporarily unavailable. Contact Outland Guides before making a payment.'; }
  }
  if (params.has('cancelled')) formStatus.textContent = 'Checkout cancelled. You can review your booking and return to Stripe when ready.';
  window.addEventListener('pageshow', event => { if (event.persisted) { busy = false; showForm(); initialize(); } });
  initialize();
  const toggle = document.getElementById('menu-toggle'), menu = document.getElementById('mobile-menu'), nav = document.getElementById('site-nav');
  toggle?.addEventListener('click', () => { const open = menu.classList.contains('hidden'); menu.classList.toggle('hidden', !open); toggle.setAttribute('aria-expanded', String(open)); });
  window.addEventListener('scroll', () => nav.classList.toggle('nav-scrolled', scrollY > 20), {passive: true});
})();
