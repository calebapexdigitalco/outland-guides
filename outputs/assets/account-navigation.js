/* The same passwordless account control on every public page. */
(function () {
  'use strict';
  const actions = document.querySelector('#site-nav .nav-actions');
  if (!actions || document.getElementById('account-navigation')) return;
  document.querySelectorAll('#site-nav a[href="/account"]').forEach(link => link.remove());
  const wrapper = document.createElement('div');
  wrapper.id = 'account-navigation';
  wrapper.innerHTML = '<a class="account-bubble" href="/account" aria-label="My Trips / Sign in"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg><span class="account-bubble-label">My Trips</span><svg class="account-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" hidden><path d="m6 9 6 6 6-6"/></svg></a><div class="account-dropdown" id="account-dropdown" hidden><p class="account-dropdown-caption">Signed in as</p><p class="account-email"></p><a href="/account">My trips <span aria-hidden="true">↗</span></a><a href="/account?view=profile">Account & profile</a><a href="/payments">Plan a new trip</a><p class="account-security">Email-code sign-in. No password needed.</p><button type="button" class="account-signout">Sign out</button><p class="account-nav-status" role="status" hidden></p></div>';
  actions.prepend(wrapper);
  let session = null;
  const bubble = wrapper.querySelector('.account-bubble');
  const dropdown = wrapper.querySelector('.account-dropdown');
  const signout = wrapper.querySelector('.account-signout');
  function close(restoreFocus = false) {
    dropdown.hidden = true;
    if (session?.user) bubble.setAttribute('aria-expanded', 'false');
    if (restoreFocus) bubble.focus();
  }
  function render(value) {
    session = value;
    close();
    const signedIn = Boolean(session?.user);
    bubble.setAttribute('aria-label', signedIn ? 'My Trips and account for ' + session.user.email : 'My Trips / Sign in');
    wrapper.querySelector('.account-chevron').hidden = !signedIn;
    if (signedIn) {
      bubble.setAttribute('aria-expanded', 'false');
      bubble.setAttribute('aria-controls', 'account-dropdown');
      wrapper.querySelector('.account-email').textContent = session.user.email;
    } else {
      bubble.removeAttribute('aria-expanded');
      bubble.removeAttribute('aria-controls');
      wrapper.querySelector('.account-email').textContent = '';
    }
    wrapper.classList.toggle('is-signed-in', signedIn);
  }
  async function refresh() {
    try {
      const response = await fetch('/api/booking/session', {credentials:'same-origin', cache:'no-store', headers:{Accept:'application/json'}});
      if (response.ok) render(await response.json());
    } catch { /* The sign-in link remains usable if the account service is unavailable. */ }
  }
  bubble.addEventListener('click', event => {
    if (!session?.user) return;
    event.preventDefault();
    const opening = dropdown.hidden;
    close();
    dropdown.hidden = !opening;
    bubble.setAttribute('aria-expanded', String(opening));
    if (opening) {
      document.getElementById('mobile-menu')?.classList.add('hidden');
      document.getElementById('menu-toggle')?.setAttribute('aria-expanded', 'false');
    }
  });
  bubble.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && session?.user) {
      event.preventDefault();
      if (dropdown.hidden) bubble.click();
      dropdown.querySelector('a').focus();
    }
  });
  document.addEventListener('click', event => { if (!wrapper.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dropdown.hidden) close(true); });
  wrapper.addEventListener('focusout', () => queueMicrotask(() => { if (!wrapper.contains(document.activeElement)) close(); }));
  signout.addEventListener('click', async () => {
    signout.disabled = true;
    const notice = wrapper.querySelector('.account-nav-status');
    notice.hidden = true;
    try {
      const response = await fetch('/api/booking/logout', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':session.csrf},body:'{}'});
      if (!response.ok) throw Error('Please reload the page and try signing out again.');
      render(null);
      await refresh();
      window.dispatchEvent(new Event('outland:account-signed-out'));
    } catch (error) { notice.textContent = error.message; notice.hidden = false; }
    finally { signout.disabled = false; }
  });
  window.addEventListener('outland:account-changed', event => render(event.detail));
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  refresh();
})();
