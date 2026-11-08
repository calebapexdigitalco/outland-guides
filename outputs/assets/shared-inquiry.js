/* One booking form shared by every Outland Guides page. */
(function () {
  const markup = "<div id=\"inquiry-modal\" class=\"fixed inset-0 z-50 hidden items-center justify-center p-4 sm:p-6\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"inquiry-title\"><div data-close-modal class=\"absolute inset-0 bg-black/75 backdrop-blur-sm\"></div><div class=\"drawer-enter relative max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#111925] shadow-2xl\"><button data-close-modal class=\"absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10 hover:text-white\" aria-label=\"Close inquiry form\"><i data-lucide=\"x\" class=\"h-5 w-5\"></i></button><div class=\"border-b border-white/10 px-6 py-7 sm:px-9\"><p class=\"text-xs font-black uppercase tracking-[.18em] text-summit\">Start your expedition</p><h2 id=\"inquiry-title\" class=\"mt-2 text-3xl font-black text-white\">Tell us where you want to go.</h2><p class=\"mt-2 text-sm text-white/60\">We’ll review your objective and send the right next step—not an automated pitch.</p></div><form id=\"inquiry-form\" class=\"grid gap-5 px-6 py-7 sm:grid-cols-2 sm:px-9\"><label class=\"text-xs font-bold uppercase tracking-wider text-white/65\">Full Name<input required name=\"name\" type=\"text\" class=\"mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-summit\" placeholder=\"Your name\" /></label><label class=\"text-xs font-bold uppercase tracking-wider text-white/65\">Email Address<input required name=\"email\" type=\"email\" class=\"mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-summit\" placeholder=\"you@example.com\" /></label><label class=\"text-xs font-bold uppercase tracking-wider text-white/65\">Selected Expedition<select id=\"expedition-select\" required name=\"expedition\" class=\"mt-2 w-full rounded-lg border border-white/15 bg-[#111925] px-4 py-3 text-sm text-white outline-none focus:border-summit\"><option>Mount Kilimanjaro</option><option>Volcán de Fuego</option><option>Mount Kilimanjaro + Wildlife Safari Add-On</option><option>Wildlife Safari</option><option>Custom / Private Expedition</option></select></label><label class=\"text-xs font-bold uppercase tracking-wider text-white/65\">Target Travel Window<input required name=\"window\" type=\"text\" class=\"mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-summit\" placeholder=\"e.g., January–February 2027\" /></label><label class=\"sm:col-span-2 text-xs font-bold uppercase tracking-wider text-white/65\">Technical Mountaineering Experience<select required name=\"experience\" class=\"mt-2 w-full rounded-lg border border-white/15 bg-[#111925] px-4 py-3 text-sm text-white outline-none focus:border-summit\"><option value=\"\">Select your experience</option><option>Beginner / New to mountain travel</option><option>Intermediate / Previous high-altitude experience</option><option>Advanced Alpine / Technical mountain experience</option></select></label><label class=\"sm:col-span-2 text-xs font-bold uppercase tracking-wider text-white/65\">Notes / Questions<textarea name=\"notes\" rows=\"4\" class=\"mt-2 w-full resize-none rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-summit\" placeholder=\"Tell us what draws you to this objective, group size, or anything we should know.\"></textarea></label><div class=\"sm:col-span-2 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center\"><p class=\"max-w-xs text-xs leading-relaxed text-white/45\">Submitting opens a pre-addressed email to Outland Guides with your inquiry details.</p><button type=\"submit\" class=\"inline-flex items-center gap-2 rounded-full bg-summit px-6 py-3.5 text-xs font-black uppercase tracking-[.12em] text-white shadow-ember transition hover:bg-orange-700\">Send Inquiry <i data-lucide=\"send\" class=\"h-4 w-4\"></i></button></div></form></div></div>";
  const endpoint = 'https://formspree.io/f/meaawnoq';
  let modal, previousFocus;
  function prepareForm(form) {
    form.action = endpoint;
    form.method = 'POST';
    const note = form.querySelector('button[type="submit"]')?.parentElement.querySelector('p');
    if (note) note.textContent = 'Your inquiry goes directly to Outland Guides. We will follow up personally.';
    const status = document.createElement('p');
    status.dataset.deliveryStatus = '';
    status.className = 'sm:col-span-2 text-sm leading-relaxed text-white';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    form.append(status);
  }
  async function deliver(event) {
    const form = event.target;
    if (!form.matches('#inquiry-form, #contact-form')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (form.dataset.sending === 'true') return;
    const status = form.querySelector('[data-delivery-status]');
    const button = form.querySelector('button[type="submit"]');
    const originalLabel = button.innerHTML;
    const data = new FormData(form);
    const expedition = data.get('expedition') || data.get('interest') || 'General inquiry';
    data.set('expedition', expedition);
    data.set('travel_window', data.get('travel_window') || data.get('window') || 'Flexible');
    data.set('message', data.get('message') || data.get('notes') || '');
    data.set('source_page', window.location.href);
    data.set('form_type', form.id === 'contact-form' ? 'Contact page' : 'Expedition inquiry');
    data.set('_subject', 'Outland Guides inquiry: ' + expedition);
    form.dataset.sending = 'true';
    form.setAttribute('aria-busy', 'true');
    button.disabled = true;
    button.textContent = 'Sending…';
    status.hidden = false;
    status.textContent = 'Sending your inquiry…';
    try {
      const response = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        const reason = Array.isArray(result.errors) ? result.errors.map(error => error.message).filter(Boolean).join(' ') : '';
        throw new Error(reason || 'Your inquiry could not be sent. Please try again or email info@outlandguides.com.');
      }
      form.reset();
      status.textContent = 'Thanks—your inquiry has been sent. We will be in touch personally.';
    } catch (error) {
      status.textContent = error instanceof TypeError ? 'We could not confirm delivery. Your details are still here. Please check your connection and try again, or email info@outlandguides.com.' : error.message;
    } finally {
      delete form.dataset.sending;
      form.removeAttribute('aria-busy');
      button.disabled = false;
      button.innerHTML = originalLabel;
    }
  }
  function close() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('modal-open', 'overflow-hidden');
    previousFocus?.focus();
  }
  function open(trigger) {
    previousFocus = trigger;
    const selected = modal.querySelector('[name="expedition"]');
    const requested = trigger.hasAttribute('data-custom-inquiry') ? 'Custom / Private Expedition' : trigger.dataset.expedition;
    if (requested) {
      const options = [...selected.options];
      const match = options.find(option => option.value === requested) || options.find(option => requested.includes(option.value) || option.value.includes(requested));
      if (match) selected.value = match.value;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('modal-open');
    modal.querySelector('input')?.focus({preventScroll:true});
  }
  function initialize() {
    document.querySelectorAll('#inquiry-modal').forEach(el => el.remove());
    document.body.insertAdjacentHTML('beforeend', markup);
    modal = document.getElementById('inquiry-modal');
    modal.dataset.sharedInquiry = 'ready';
    // Capture booking actions before older page-specific handlers can open another form.
    document.addEventListener('click', event => {
      const payment=event.target.closest('[data-book-route], [data-payment-link]');
      if(payment){
        event.preventDefault();
        event.stopImmediatePropagation();
        const query=payment.dataset.bookRoute?'?route='+encodeURIComponent(payment.dataset.bookRoute):'';
        window.location.href='/payments'+query;
        return;
      }
      const trigger = event.target.closest('[data-open-modal], [data-custom-inquiry], .mobile-book-cta');
      if (!trigger) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      open(trigger);
    }, true);
    modal.addEventListener('click', event => {
      if (event.target.closest('[data-close-modal]')) close();
    });
    document.addEventListener('keydown', event => {
      if (modal.classList.contains('hidden')) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const controls = [...modal.querySelectorAll('button,input,select,textarea,a[href]')].filter(el => !el.disabled);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    document.querySelectorAll('#inquiry-form, #contact-form').forEach(prepareForm);
    document.querySelectorAll('[data-book-route] span:last-child').forEach(label=>label.textContent='View payment options →');
    document.querySelectorAll('footer').forEach(footer=>{
      if(footer.querySelector('[data-payment-link]'))return;
      footer.insertAdjacentHTML('beforeend','<div class="mx-auto mt-6 max-w-7xl border-t border-white/10 pt-5"><a href="/payments" data-payment-link class="text-xs font-black uppercase tracking-[.12em] text-summit transition hover:text-[#D68456]">Make a Payment →</a></div>');
    });
    // Prevent the original page-level email-app handlers from running.
    document.addEventListener('submit', deliver, true);
    window.lucide?.createIcons();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();

