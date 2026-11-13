(function(){
  const offerings=`<div><p class="text-[10px] font-black uppercase tracking-[.15em] text-summit">Africa</p><a href="/kilimanjaro" class="mt-3 block text-sm">Kilimanjaro</a><a href="/safari" class="mt-2 block text-sm">Wildlife Safari</a></div><div><p class="text-[10px] font-black uppercase tracking-[.15em] text-summit">Central America</p><a href="/volcan-de-fuego" class="mt-3 block text-sm">Volcán de Fuego</a></div>`;
  const exploreLinks=`<a class="block hover:text-summit" href="/kilimanjaro">Kilimanjaro</a><a class="block hover:text-summit" href="/safari">Wildlife Safari</a><a class="block hover:text-summit" href="/volcan-de-fuego">Volcán de Fuego</a>`;
  const cancellationFaq=['What is your cancellation policy?',`<p>Plans can change. Our policy is designed to be clear and consistent while recognizing the advance planning, permits, and local operating costs behind an expedition.</p><p class="mt-3"><strong class="text-white">Trip cancellation insurance is strongly recommended</strong> for every Outland Guides program. Government and operator permits can create meaningful non-recoverable costs, so our refund terms are firm.</p><div class="mt-4 rounded-lg border border-white/10 bg-white/[.04] p-4"><p class="font-black text-white">Payment schedule</p><ul class="mt-2 list-disc space-y-1 pl-5 marker:text-summit"><li>50% is due to reserve your place.</li><li>The standard balance deadline is 60 days before departure. Closer-in bookings have a payment deadline confirmed in writing before you pay.</li><li>Any non-refundable registration fee must be itemized before payment; no undisclosed fee is deducted.</li></ul></div><ul class="mt-4 list-disc space-y-2 pl-5 marker:text-summit"><li>Cancel 120 or more days before the program start date: full refund less the registration fee.</li><li>Cancel 90-119 days before the program start date: 50% refund less the registration fee.</li><li>Cancel 89 or fewer days before the program start date: no refund.</li><li>Send every cancellation or refund request to our office by email within the applicable deadline.</li><li>If Outland Guides cancels or reschedules before the trip begins, all paid fees are refundable and/or transferable.</li></ul><p class="mt-4">Your written trip agreement confirms payment timing and any disclosed registration fee or trip-specific terms before you commit. <a class="font-bold text-summit" href="/privacy-terms#cancellation">Read the full cancellation and booking policy →</a></p>`];
  const faq=[
    ['How do I choose a good tour operator?','Look for a clear safety process, transparent inclusions, guide credentials, realistic summit language, and a team willing to discuss your experience before taking payment. Outland vets local operators, stays involved through preparation and logistics, and helps match the route to you—not the other way around.'],
    ['How much does an expedition cost?','Kilimanjaro pricing is confirmed around one of six options: Machame 6-Day, Machame 7-Day, Lemosho 6-Day, Lemosho 7-Day, Marangu 5-Day, or Marangu 6-Day. Your proposal reflects route length, group size, dates, park costs, and selected lodging and transfers. International flights, insurance, personal gear, and gratuities are generally separate.'],
    ['When is the best time to go?','The strongest travel window depends on the objective, weather patterns, route conditions, crowds, and your own training runway. We discuss the current local forecast and guide calendar before recommending a window instead of applying a one-size-fits-all date.'],
    ['How long does each expedition take?','Kilimanjaro has six itinerary options: Machame and Lemosho in 6 or 7 days, plus Marangu in 5 or 6 days. Volcán de Fuego is typically a focused multi-day volcanic trek. Wildlife safaris are tailored around the climbing itinerary, recovery needs, and the parks you want to experience. <a class="font-bold text-summit hover:text-[#D68456]" href="/kilimanjaro">Compare Kilimanjaro routes →</a>'],
    ['What is the weather like?','Expect changeable mountain weather: warm sun, cold nights, wind, rain, and rapid shifts are all possible. Safari conditions are different again. Your gear plan and guide briefing are built around the specific terrain and season, then adjusted for current conditions on the ground.'],
    ['What gear do I need?','Every trip begins with a reliable layering system, weather protection, appropriate footwear, hydration, and a pack that fits. We review the equipment you already own before suggesting purchases, so you arrive with a system rather than an expensive pile of gear. <a class="font-bold text-summit hover:text-[#D68456]" href="/gear-help">See Gear Help →</a>'],
    ['How should I train?','Build a durable aerobic base, add sustained uphill hiking or stairs, practice carrying a pack, strengthen legs and core, and leave room for recovery. Your training should prepare you for consecutive days outside, not just a single hard workout.'],
    ['Is mountain travel dangerous?','There is real risk in any mountain environment: altitude, weather, terrain, fatigue, and changing conditions. Good planning reduces risk through the right route, capable local guides, medical awareness, emergency plans, and the willingness to turn around when needed. No ethical operator guarantees a summit.'],
    ['Why are your prices often lower than larger operators?','Outland works directly with vetted local guide companies instead of layering large overhead, generic marketing systems, and multiple middlemen on top of the trip. Lower cost never means cutting safety, fair compensation, route time, or preparation support.'],
    ['Can I add a wildlife safari to Kilimanjaro?','Yes. We can coordinate a wildlife safari after your climb with recovery time and travel buffers built into the plan. Choose the “Kilimanjaro + Wildlife Safari Add-On” option when you contact us, and we will shape the experience around your route and dates.'],
    ['Do I need travel insurance?','Comprehensive medical and evacuation insurance appropriate to the altitude is required for Kilimanjaro. Other program requirements are confirmed in your written proposal. We strongly recommend cancellation and interruption coverage for every trip; check activity limits and exclusions before buying.'],
    ['Will I know who is guiding me?','You will know the guide-team plan before departure and will have clear communication with Outland throughout preparation. In-country, the vetted local team leads the expedition with the local knowledge that matters most.'],
    ['Can I join as a solo traveler?','Often, yes. We can discuss an established departure, a private guide arrangement, or the right way to pair you with other climbers. The best answer depends on your route, dates, and comfort with group travel.'],
    ['How far ahead should I book?','More lead time gives you better route, permit, flight, training, and guide-calendar options. Reach out as soon as you have a rough travel window; we can tell you what is realistic without pressuring you to commit.'],
    ['Can you help me choose the right Kilimanjaro route?','Yes. We compare Machame 6-Day, Machame 7-Day, Lemosho 6-Day, Lemosho 7-Day, Marangu 5-Day, and Marangu 6-Day based on your hiking history, preferred pace, available time, and how deliberately you want to acclimatize. <a class="font-bold text-summit hover:text-[#D68456]" href="/kilimanjaro">Explore the route profiles →</a>']
  ];
  const mobileOfferings=[['Kilimanjaro','/kilimanjaro'],['Wildlife Safari','/safari'],['Volcán de Fuego','/volcan-de-fuego']];
  function ensureMobileNavigation(){
    const nav=document.getElementById('site-nav'),header=nav?.firstElementChild;if(!nav||!header)return;
    let toggle=document.getElementById('menu-toggle'),menu=document.getElementById('mobile-menu');
    let createdNavigation=false;
    if(!toggle){
      createdNavigation=true;toggle=document.createElement('button');toggle.id='menu-toggle';toggle.type='button';toggle.className='grid h-11 w-11 place-items-center rounded-full border border-[#44443D]/30 text-obsidian lg:hidden';toggle.setAttribute('aria-controls','mobile-menu');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');toggle.innerHTML='<i data-lucide="menu" class="h-5 w-5"></i>';header.append(toggle);
    }
    if(!menu){
      createdNavigation=true;menu=document.createElement('div');menu.id='mobile-menu';menu.className='hidden border-t border-[#44443D]/15 bg-[#FDFDFD]/95 px-5 pb-6 pt-4 text-obsidian backdrop-blur-xl lg:hidden';menu.innerHTML='<div class="grid gap-3 text-sm font-black uppercase tracking-[.12em]"><a href="/#expeditions">Expeditions</a><a href="/about">About Us</a><a href="/gear-help">Gear Help</a><a href="/faq">FAQ</a><a href="/contact">Contact</a></div>';header.after(menu);
    }
    if(!createdNavigation||toggle.dataset.outlandMenuReady)return;
    toggle.dataset.outlandMenuReady='true';toggle.addEventListener('click',()=>{const open=!menu.classList.contains('hidden');menu.classList.toggle('hidden',open);toggle.setAttribute('aria-expanded',String(!open));toggle.innerHTML=`<i data-lucide="${open?'menu':'x'}" class="h-5 w-5"></i>`;window.lucide?.createIcons()});
  }
  function setPersistentBookButton(){
    const nav=document.getElementById('site-nav'),header=nav?.firstElementChild;if(!header)return;
    let button=[...header.querySelectorAll('a,button')].find(item=>!item.closest('#mobile-menu')&&!item.closest('.lg\\:flex')&&(item.hasAttribute('data-open-modal')||/book an expedition|start an inquiry/i.test(item.textContent)));
    if(!button){button=document.createElement('a');button.href='/contact';button.textContent='Book an Expedition';const toggle=header.querySelector('#menu-toggle');toggle?.before(button)}
    button.classList.remove('hidden','sm:block');button.classList.add('mobile-book-cta');
    const toggle=header.querySelector('#menu-toggle');
    let actions=toggle?.parentElement;
    if(actions===header){actions=document.createElement('div');header.append(actions)}
    if(actions){actions.classList.add('nav-actions');actions.append(button,toggle)}
  }
  function setMobileExpeditions(){
    const menu=document.getElementById('mobile-menu');if(!menu||menu.dataset.expeditionsReady)return;
    const link=[...menu.querySelectorAll('a')].find(item=>item.textContent.trim()==='Expeditions');if(!link)return;
    menu.dataset.expeditionsReady='true';
    [...menu.querySelectorAll('a')].filter(item=>mobileOfferings.some(([name])=>item.textContent.trim()===name)).forEach(item=>item.remove());
    const group=document.createElement('div');group.className='mobile-expedition-group';
    group.innerHTML=`<button type="button" class="mobile-expedition-toggle" aria-expanded="false">Expeditions <i data-lucide="chevron-down" class="h-4 w-4"></i></button><div class="mobile-expedition-links hidden">${mobileOfferings.map(([name,href])=>`<a href="${href}">${name}</a>`).join('')}</div>`;
    link.replaceWith(group);
    const toggle=group.querySelector('button'),links=group.querySelector('.mobile-expedition-links');
    toggle.addEventListener('click',()=>{const open=!links.classList.contains('hidden');links.classList.toggle('hidden',open);toggle.setAttribute('aria-expanded',String(!open));window.lucide?.createIcons()});
    links.querySelectorAll('a').forEach(item=>item.addEventListener('click',()=>{menu.classList.add('hidden');document.getElementById('menu-toggle')?.setAttribute('aria-expanded','false')}));
  }
  function setNavigation(){ensureMobileNavigation();document.querySelectorAll('.expedition-menu').forEach(menu=>{menu.innerHTML=offerings;menu.classList.remove('grid-cols-5','w-[900px]');menu.classList.add('grid-cols-2','w-[430px]')});document.querySelectorAll('.expedition-trigger>a').forEach(link=>link.href='/#expeditions');setMobileExpeditions();setPersistentBookButton()}
  function setFooterLogo(){document.querySelectorAll('footer img[alt="Outland Guides"]').forEach(img=>{img.src='/assets/outland-guides-text-only.png';img.className='h-auto w-44 max-w-full'})}
  function setFooters(){document.querySelectorAll('footer').forEach(footer=>{const header=[...footer.querySelectorAll('h3')].find(h=>h.textContent.trim().toLowerCase()==='explore');if(!header)return;const target=header.nextElementSibling;if(!target)return;if(target.tagName==='UL')target.innerHTML=`<li><a class="hover:text-summit" href="/kilimanjaro">Kilimanjaro</a></li><li><a class="hover:text-summit" href="/safari">Wildlife Safari</a></li><li><a class="hover:text-summit" href="/#expeditions">Volcán de Fuego</a></li>`;else target.innerHTML=exploreLinks})}
  function setFaq(){if(!/\/faq(?:\.html)?\/?$/.test(location.pathname))return;const list=document.querySelector('main .space-y-3');if(!list)return;list.innerHTML=[cancellationFaq,...faq].map(([q,a])=>`<details class="rounded-xl border border-white/10 bg-white/[.03] p-5"><summary class="flex cursor-pointer items-center justify-between gap-5 text-base font-black text-white">${q}<i data-lucide="plus" class="chev h-5 w-5 shrink-0"></i></summary><div class="answer"><div><div class="pt-4 text-sm leading-relaxed text-white/65">${a}</div></div></div></details>`).join('');window.lucide?.createIcons()}
  function setContact(){if(!/\/contact(?:\.html)?\/?$/.test(location.pathname))return;const opts='<option value="">Choose an option</option><option>Mount Kilimanjaro</option><option>Volcán de Fuego</option><option>Mount Kilimanjaro + Wildlife Safari Add-On</option><option>Wildlife Safari</option><option>Custom Expedition</option><option>General Inquiry</option>';const main=document.querySelector('select[name="interest"]');if(main){main.innerHTML=opts;const label=main.closest('label');if(!document.getElementById('travel-window'))label.insertAdjacentHTML('afterend','<label class="text-xs font-bold uppercase tracking-wider text-white/65">Rough Travel Window <span class="normal-case tracking-normal text-white/35">(flexible)</span><input id="travel-window" name="travel_window" type="month" class="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-summit" /></label>')}document.querySelectorAll('select[name="expedition"]').forEach(select=>select.innerHTML='<option>Mount Kilimanjaro</option><option>Volcán de Fuego</option><option>Mount Kilimanjaro + Wildlife Safari Add-On</option><option>Wildlife Safari</option><option>Custom Expedition</option><option>General Inquiry</option>')}
  function wireHomeInquiry(){
    if(!/\/(index\.html)?$/.test(location.pathname))return;
    const select=document.getElementById('expedition-select'),modal=document.getElementById('inquiry-modal');
    if(!select||!modal)return;
    select.innerHTML='<option>Mount Kilimanjaro</option><option>Volcán de Fuego</option><option>Mount Kilimanjaro + Wildlife Safari Add-On</option><option>Wildlife Safari</option><option>Custom Expedition</option><option>General Inquiry</option>';
    document.querySelectorAll('.expedition-card [data-open-modal]').forEach(button=>{if(button.dataset.homeBound)return;button.dataset.homeBound='true';button.addEventListener('click',()=>{const wanted=button.dataset.expedition;const match=[...select.options].find(option=>option.text===wanted);if(match)select.value=match.value;modal.classList.remove('hidden');modal.classList.add('flex');document.body.classList.add('modal-open')})});
  }
  function addHomeCta(){
    if(!/\/(index\.html)?$/.test(location.pathname)||document.getElementById('custom-expedition-cta'))return;
    const faq=document.getElementById('faq');if(!faq)return;
    faq.insertAdjacentHTML('afterend','<aside id="custom-expedition-cta" class="mt-10 overflow-hidden rounded-2xl border border-summit/35 bg-[#2A211C] p-7 shadow-ember sm:p-9"><div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><h3 class="font-display text-3xl font-black uppercase leading-none text-white">Talk to our team.</h3><p class="mt-3 max-w-xl text-sm leading-relaxed text-white/65">Submit your information, give us a few hours and we will get back to you. We won&#39;t sell your data.</p></div><button type="button" data-custom-inquiry class="shrink-0 rounded-full bg-summit px-6 py-3.5 text-xs font-black uppercase tracking-[.12em] text-white transition hover:bg-[#7A4323]">Request more information</button></div></aside>');
    document.querySelector('[data-custom-inquiry]')?.addEventListener('click',()=>{const modal=document.getElementById('inquiry-modal');if(!modal)return;modal.classList.remove('hidden');modal.classList.add('flex');document.body.classList.add('modal-open')});
  }
  function loadKilimanjaroMobileSupport(){
    if(!/\/(kilimanjaro|safari|volcan-de-fuego)(?:\.html)?\/?$/.test(location.pathname))return;
    if(!document.querySelector('link[href="/assets/kilimanjaro-mobile-tabs.css?v=launch-20261109"]')){const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/kilimanjaro-mobile-tabs.css?v=launch-20261109';document.head.append(style)}
    if(!document.querySelector('script[src="/assets/kilimanjaro-mobile-tabs.js?v=launch-20261109"]')){const script=document.createElement('script');script.src='/assets/kilimanjaro-mobile-tabs.js?v=launch-20261109';document.body.append(script)}
  }
  function loadSharedInquiry(){
    if(document.querySelector('script[src="/assets/shared-inquiry.js?v=group-inquiry-20261113"]'))return;
    const script=document.createElement('script');script.src='/assets/shared-inquiry.js?v=group-inquiry-20261113';document.body.append(script);
  }
  document.addEventListener('DOMContentLoaded',()=>{loadKilimanjaroMobileSupport();setNavigation();setFooterLogo();setFooters();setFaq();setContact();wireHomeInquiry();addHomeCta();loadSharedInquiry();window.lucide?.createIcons()});
})();

/* Volcán de Fuego is now a dedicated expedition page, not a home-page-only card. */
(function(){
  function setFuegoDestination(){
    document.querySelectorAll('a').forEach(link=>{
      if(link.textContent.trim()==='Volcán de Fuego')link.href='/volcan-de-fuego';
    });
    window.lucide?.createIcons();
  }
  document.addEventListener('DOMContentLoaded',setFuegoDestination);
})();

/* Keep footer navigation labels and destinations identical across pages. */
(function(){
  const navigation='<a class="block hover:text-summit" href="/about">About Us</a><a class="block hover:text-summit" href="/gear-help">Gear Help</a><a class="block hover:text-summit" href="/faq">FAQ</a><a class="block hover:text-summit" href="/contact">Contact</a>';
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('footer').forEach(footer=>{
      const heading=[...footer.querySelectorAll('h3')].find(item=>['navigate','prepare'].includes(item.textContent.trim().toLowerCase()));
      if(!heading)return;
      heading.textContent='Navigate';
      const target=heading.nextElementSibling;
      if(target)target.innerHTML=navigation;
    });
  });
})();

/* Shared footer preparation links and current Fuego card artwork. */
(function(){
  function updatePrepareLinks(){
    document.querySelectorAll('footer').forEach(footer=>{
      const heading=[...footer.querySelectorAll('h3')].find(item=>item.textContent.trim().toLowerCase()==='prepare');
      const list=heading?.nextElementSibling;
      if(!list)return;
      list.innerHTML=list.tagName==='UL'?'<li><a class="hover:text-summit" href="/gear-help">Gear Help</a></li><li><a class="hover:text-summit" href="/faq">Trip FAQs</a></li><li><a class="hover:text-summit" href="/faq">Safety Standards</a></li>':'<a class="block hover:text-summit" href="/gear-help">Gear Help</a><a class="block hover:text-summit" href="/faq">Trip FAQs</a><a class="block hover:text-summit" href="/faq">Safety Standards</a>';
    });
  }
  function updateFuegoCard(){
    if(!/\/(index\.html)?$/.test(location.pathname))return;
    const card=[...document.querySelectorAll('.expedition-card')].find(item=>item.querySelector('a[href="/volcan-de-fuego"]'));
    const image=card?.querySelector('.card-image');
    if(image)image.style.backgroundImage="url('/assets/volcan-de-fuego-cone-eruption.png')";
  }
  document.addEventListener('DOMContentLoaded',()=>{updatePrepareLinks();updateFuegoCard()});
})();

/* Legal links are shared across every page, including rebuilt footers. */
(function(){function add(){document.querySelectorAll("footer").forEach(f=>{if(!f.querySelector("[data-legal-links]"))f.insertAdjacentHTML("beforeend","<div class=\"policy-footer-links\" data-legal-links><a href=\"/privacy-terms#privacy\">Privacy Policy</a><a href=\"/privacy-terms#terms\">Booking Terms</a><a href=\"/privacy-terms#cancellation\">Cancellation & Refunds</a></div>");});}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",add):add();})();
