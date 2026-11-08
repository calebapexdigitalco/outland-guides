(function () {
  function revealTab(tab) {
    const tabList = tab.closest('[role="tablist"]');
    if (!tabList) return;
    const tabSection = tabList.closest('section');
    const panels = [...document.querySelectorAll('[data-panel]')];
    const tabs = [...document.querySelectorAll('[data-tab]')];
    const panel = document.querySelector(`[data-panel="${tab.dataset.tab}"]`);
    if (!panel) return;
    tabs.forEach(item => item.setAttribute('aria-selected', String(item === tab)));
    panels.forEach(item => { const active = item === panel; item.classList.toggle('hidden', !active); item.classList.toggle('panel', active); });
    panel.classList.add('kili-tab-panel');
    requestAnimationFrame(() => {
      const nav = document.getElementById('site-nav');
      const destination = panel.getBoundingClientRect().top + window.scrollY - (nav?.getBoundingClientRect().height || 0) - (tabSection?.getBoundingClientRect().height || 0) - 14;
      window.scrollTo({ top: Math.max(0, destination), behavior: 'smooth' });
      window.lucide?.createIcons();
    });
  }
  function initialize() {
    const tabList = document.querySelector('[role="tablist"]');
    if (!tabList || !/\/(kilimanjaro|safari|volcan-de-fuego)\.html$/.test(location.pathname)) return;
    tabList.classList.add('kili-tab-list');
    tabList.closest('section')?.classList.add('kili-tab-section');
    const safari=location.pathname.endsWith('safari.html');
    const kilimanjaro=location.pathname.endsWith('kilimanjaro.html');
    if(safari||kilimanjaro){
      const hero=document.querySelector('main > section:first-child');
      if(kilimanjaro)hero?.classList.add('kilimanjaro-hero');
      const copy=hero?.querySelector('h1')?.parentElement;
      if(copy&&!copy.querySelector('[data-explore-trip]')){
        const expedition=safari?'Wildlife Safari':'Mount Kilimanjaro';
        copy.insertAdjacentHTML('beforeend',`<div class="expedition-hero-actions mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><button type="button" data-explore-trip class="inline-flex items-center justify-center rounded-full bg-summit px-6 py-3 text-xs font-black uppercase tracking-[.12em] text-white shadow-ember transition hover:bg-[#7A4323]">Explore the trip</button><button type="button" data-open-modal data-expedition="${expedition}" class="inline-flex items-center justify-center rounded-full border border-white/30 bg-black/20 px-6 py-3 text-xs font-black uppercase tracking-[.12em] text-white transition hover:border-white">Plan your dates</button></div>`);
        copy.querySelector('[data-explore-trip]').addEventListener('click',()=>revealTab(tabList.querySelector('[data-tab="overview"]')));
      }
    }
    document.addEventListener('click', event => { const tab = event.target.closest('[data-tab]'); if (!tab || !tab.closest('[role="tablist"]')) return; event.preventDefault(); event.stopPropagation(); revealTab(tab); }, true);
    document.addEventListener('click', event => {
      const link=event.target.closest('.route-side a');
      if(!link || window.innerWidth>=640)return;
      const target=document.querySelector(link.getAttribute('href'));
      if(!target)return;
      event.preventDefault();event.stopPropagation();
      link.closest('.route-side').querySelectorAll('a').forEach(item=>{const active=item===link;item.classList.toggle('active',active);if(active)item.setAttribute('aria-current','location');else item.removeAttribute('aria-current')});
      const offset=(document.getElementById('site-nav')?.getBoundingClientRect().height||0)+(tabList.closest('section')?.getBoundingClientRect().height||0)+16;
      window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+window.scrollY-offset),behavior:'smooth'});
    },true);
    if(location.pathname.endsWith('safari.html')){
      const gear=document.querySelector('[data-panel="gear"] > div');
      if(gear&&!gear.querySelector('[data-gear-inquiry]')){
        gear.insertAdjacentHTML('beforeend','<div class="mt-8 flex flex-col items-start gap-4 rounded-xl border border-summit/30 bg-summit/10 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-black text-white">Questions about what to pack?</p><p class="mt-2 text-sm leading-relaxed text-white/65">We can review what you own and help you fill the gaps.</p></div><button type="button" data-gear-inquiry data-open-modal data-expedition="Wildlife Safari" class="inline-flex shrink-0 items-center justify-center rounded-full bg-summit px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#7A4323]">Talk through your gear</button></div>');
      }
      const overview=document.querySelector('[data-panel="overview"]');
      if(overview&&!overview.querySelector('#safari-overview-booking')){
        overview.insertAdjacentHTML('beforeend','<section id="safari-overview-booking" class="mt-12 rounded-2xl border border-summit/35 bg-summit/10 p-6 sm:p-9"><div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div class="max-w-xl"><p class="text-xs font-black uppercase tracking-[.16em] text-summit">Your safari starts here</p><h3 class="mt-3 text-2xl font-black uppercase leading-tight text-white sm:text-3xl">Make room for the wild.</h3><p class="mt-3 text-sm leading-relaxed text-white/65">Share your dates and group size. We will help you choose the right safari, on its own or after Kilimanjaro.</p></div><button type="button" data-open-modal data-expedition="Wildlife Safari" class="inline-flex shrink-0 items-center justify-center rounded-full bg-summit px-6 py-4 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#7A4323]">Book your safari</button></div></section>');
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
