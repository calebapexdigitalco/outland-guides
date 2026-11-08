(function(){
  const offerings=`<div><p class="text-[10px] font-black uppercase tracking-[.15em] text-summit">Africa</p><a href="/kilimanjaro" class="mt-3 block text-sm">Kilimanjaro</a><a href="/safari" class="mt-2 block text-sm">Wildlife Safari</a></div><div><p class="text-[10px] font-black uppercase tracking-[.15em] text-summit">Central America</p><a href="/volcan-de-fuego" class="mt-3 block text-sm">Volcán de Fuego</a></div>`;
  const exploreLinks=`<a class="block hover:text-summit" href="/kilimanjaro">Kilimanjaro</a><a class="block hover:text-summit" href="/safari">Wildlife Safari</a><a class="block hover:text-summit" href="/volcan-de-fuego">Volcán de Fuego</a>`;
  const cancellationFaq=['What is your cancellation policy?',`<p>Plans can change. Our policy is designed to be clear and consistent while recognizing the advance planning, permits, and local operating costs behind an expedition.</p><p class="mt-3"><strong class="text-white">Trip cancellation insurance is strongly recommended</strong> for every Outland Guides program. Government and operator permits can create meaningful non-recoverable costs, so our refund terms are firm.</p><div class="mt-4 rounded-lg border border-white/10 bg-white/[.04] p-4"><p class="font-black text-white">Payment schedule</p><ul class="mt-2 list-disc space-y-1 pl-5 marker:text-summit"><li>50% is due to reserve your place.</li><li>The remaining balance is due 60 days before departure, or within 30 days of the trip when booking closer in - whichever comes first.</li><li>Every deposit includes a non-refundable registration fee.</li></ul></div><ul class="mt-4 list-disc space-y-2 pl-5 marker:text-summit"><li>Cancel 120 or more days before the course start date: full refund less the registration fee.</li><li>Cancel 90-119 days before the course start date: 50% refund less the registration fee.</li><li>Cancel 89 or fewer days before the course start date: no refund.</li><li>Send every cancellation or refund request to our office by email within the applicable deadline.</li><li>If Outland Guides cancels or reschedules before the trip begins, all paid fees are refundable and/or transferable.</li></ul><p class="mt-4">Your written trip agreement will confirm the exact registration fee, payment timing, and any route-specific permit terms before you commit.</p>`];
  const faq=[
    ['How do I choose a good tour operator?','Look for a clear safety process, transparent inclusions, guide credentials, realistic summit language, and a team willing to discuss your experience before taking payment. Outland vets local operators, stays involved through preparation and logistics, and helps match the route to you—not the other way around.'],
    ['How much does an expedition cost?','Kilimanjaro pricing is confirmed around one of four options: Machame 6-Day, Machame 7-Day, Lemosho 6-Day, or Lemosho 7-Day. Your proposal reflects route length, group size, dates, park costs, and selected lodging and transfers. International flights, insurance, personal gear, and gratuities are generally separate.'],
    ['When is the best time to go?','The strongest travel window depends on the objective, weather patterns, route conditions, crowds, and your own training runway. We discuss the current local forecast and guide calendar before recommending a window instead of applying a one-size-fits-all date.'],
    ['How long does each expedition take?','Kilimanjaro has four route options: Machame and Lemosho, each offered in a 6- or 7-day itinerary. Volcán de Fuego is typically a focused multi-day volcanic trek. Wildlife safaris are tailored around the climbing itinerary, recovery needs, and the parks you want to experience. <a class="font-bold text-summit hover:text-[#D68456]" href="/kilimanjaro">Compare Kilimanjaro routes →</a>'],
    ['What is the weather like?','Expect changeable mountain weather: warm sun, cold nights, wind, rain, and rapid shifts are all possible. Safari conditions are different again. Your gear plan and guide briefing are built around the specific terrain and season, then adjusted for current conditions on the ground.'],
    ['What gear do I need?','Every trip begins with a reliable layering system, weather protection, appropriate footwear, hydration, and a pack that fits. We review the equipment you already own before suggesting purchases, so you arrive with a system rather than an expensive pile of gear. <a class="font-bold text-summit hover:text-[#D68456]" href="/gear-help">See Gear Help →</a>'],
    ['How should I train?','Build a durable aerobic base, add sustained uphill hiking or stairs, practice carrying a pack, strengthen legs and core, and leave room for recovery. Your training should prepare you for consecutive days outside, not just a single hard workout.'],
    ['Is mountain travel dangerous?','There is real risk in any mountain environment: altitude, weather, terrain, fatigue, and changing conditions. Good planning reduces risk through the right route, capable local guides, medical awareness, emergency plans, and the willingness to turn around when needed. No ethical operator guarantees a summit.'],
    ['Why are your prices often lower than larger operators?','Outland works directly with vetted local guide companies instead of layering large overhead, generic marketing systems, and multiple middlemen on top of the trip. Lower cost never means cutting safety, fair compensation, route time, or preparation support.'],
    ['Can I add a wildlife safari to Kilimanjaro?','Yes. We can coordinate a wildlife safari after your climb with recovery time and travel buffers built into the plan. Choose the “Kilimanjaro + Wildlife Safari Add-On” option when you contact us, and we will shape the experience around your route and dates.'],
    ['Do I need travel insurance?','We strongly recommend comprehensive trip and emergency evacuation coverage suitable for your destination and altitude. We will explain what to look for, but the policy you choose should be reviewed carefully before travel.'],
    ['Will I know who is guiding me?','You will know the guide-team plan before departure and will have clear communication with Outland throughout preparation. In-country, the vetted local team leads the expedition with the local knowledge that matters most.'],
    ['Can I join as a solo traveler?','Often, yes. We can discuss an established departure, a private guide arrangement, or the right way to pair you with other climbers. The best answer depends on your route, dates, and comfort with group travel.'],
    ['How far ahead should I book?','More lead time gives you better route, permit, flight, training, and guide-calendar options. Reach out as soon as you have a rough travel window; we can tell you what is realistic without pressuring you to commit.'],
    ['Can you help me choose the right Kilimanjaro route?','Yes. We compare Machame 6-Day, Machame 7-Day, Lemosho 6-Day, and Lemosho 7-Day based on your hiking history, preferred pace, available time, and how deliberately you want to acclimatize. <a class="font-bold text-summit hover:text-[#D68456]" href="/kilimanjaro">Explore the route profiles →</a>']
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
  function setContact(){if(!/\/contact(?:\.html)?\/?$/.test(location.pathname))return;const opts='<option value="">Choose an option</option><option>Mount Kilimanjaro</option><option>Volcán de Fuego</option><option>Mount Kilimanjaro + Wildlife Safari Add-On</option><option>Wildlife Safari</option><option>General Question</option>';const main=document.querySelector('select[name="interest"]');if(main){main.innerHTML=opts;const label=main.closest('label');if(!document.getElementById('travel-window'))label.insertAdjacentHTML('afterend','<label class="text-xs font-bold uppercase tracking-wider text-white/65">Rough Travel Window <span class="normal-case tracking-normal text-white/35">(flexible)</span><input id="travel-window" name="travel_window" type="month" class="mt-2 w-full rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-summit" /></label>')}document.querySelectorAll('select[name="expedition"]').forEach(select=>select.innerHTML='<option>Mount Kilimanjaro</option><option>Volcán de Fuego</option><option>Mount Kilimanjaro + Wildlife Safari Add-On</option><option>Wildlife Safari</option>')}
  function setHome(){if(!/\/(index\.html)?$/.test(location.pathname))return;const cards=document.querySelectorAll('.expedition-card');if(cards.length<3)return;const safari=cards[1],fuego=cards[2];safari.querySelector('.card-image').style.backgroundImage="url('/assets/wildlife-safari-expedition.png')";safari.innerHTML=`<div class="card-image relative h-64 overflow-hidden bg-cover bg-center" style="background-image:url('/assets/wildlife-safari-expedition.png')"><span class="absolute right-4 top-4 rounded-full bg-summit px-3 py-1.5 text-xs font-black text-white">Tanzania</span><div class="absolute bottom-4 left-5"><p class="text-[10px] font-black uppercase tracking-[.18em] text-white/60">Northern Circuit</p><h3 class="mt-1 text-2xl font-black text-white">Wildlife Safari</h3></div></div><div class="p-6"><div class="flex flex-wrap gap-2"><span class="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">Private Itinerary</span><span class="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">Flexible Days</span><span class="rounded bg-orange-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-200">Safari Extension</span></div><p class="mt-5 text-sm leading-relaxed text-white/65">A locally guided wildlife itinerary built around your pace—an ideal recovery-minded extension after Kilimanjaro or a standalone Tanzania journey.</p><p class="mt-5 border-t border-white/10 pt-4 text-xs text-white/55"><span class="font-bold text-white/80">Includes:</span> private vehicle, local driver-guide, park planning, lodging coordination, and flexible route design.</p><div class="mt-6 flex items-center justify-between gap-3"><p class="text-sm font-black text-white">Custom <span class="font-medium text-white/50">itinerary</span></p><button data-open-modal data-expedition="Wildlife Safari" class="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-summit hover:text-orange-300">Details & Inquire <i data-lucide="arrow-up-right" class="h-4 w-4"></i></button></div></div>`;fuego.innerHTML=`<div class="card-image relative h-64 overflow-hidden bg-cover bg-center" style="background-image:url('/assets/volcan-de-fuego-eruption.png')"><span class="absolute right-4 top-4 rounded-full bg-summit px-3 py-1.5 text-xs font-black text-white">12,346 ft</span><div class="absolute bottom-4 left-5"><p class="text-[10px] font-black uppercase tracking-[.18em] text-white/60">Guatemala</p><h3 class="mt-1 text-2xl font-black text-white">Volcán de Fuego</h3></div></div><div class="p-6"><div class="flex flex-wrap gap-2"><span class="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">Acatenango Traverse</span><span class="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">3 Days</span><span class="rounded bg-orange-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-200">Volcanic Trek</span></div><p class="mt-5 text-sm leading-relaxed text-white/65">A highland ascent into Guatemala’s volcanic spine, timed around a raw, unforgettable view of Fuego’s active crater.</p><p class="mt-5 border-t border-white/10 pt-4 text-xs text-white/55"><span class="font-bold text-white/80">Includes:</span> local mountain team, private transfers, camp logistics, meals, route and weather planning.</p><div class="mt-6 flex items-center justify-between gap-3"><p class="text-sm font-black text-white">From $200 <span class="font-medium text-white/50">/ climber</span></p><button data-open-modal data-expedition="Volcán de Fuego — Acatenango Traverse" class="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-summit hover:text-orange-300">Details & Inquire <i data-lucide="arrow-up-right" class="h-4 w-4"></i></button></div></div>`;window.lucide?.createIcons()}
  function wireHomeInquiry(){
    if(!/\/(index\.html)?$/.test(location.pathname))return;
    const select=document.getElementById('expedition-select'),modal=document.getElementById('inquiry-modal');
    if(!select||!modal)return;
    select.innerHTML='<option>Mount Kilimanjaro</option><option>Volcán de Fuego</option><option>Mount Kilimanjaro + Wildlife Safari Add-On</option><option>Wildlife Safari</option>';
    document.querySelectorAll('.expedition-card [data-open-modal]').forEach(button=>{if(button.dataset.homeBound)return;button.dataset.homeBound='true';button.addEventListener('click',()=>{const wanted=button.dataset.expedition;const match=[...select.options].find(option=>option.text===wanted);if(match)select.value=match.value;modal.classList.remove('hidden');modal.classList.add('flex');document.body.classList.add('modal-open')})});
  }
  function addHomeCta(){
    if(!/\/(index\.html)?$/.test(location.pathname)||document.getElementById('custom-expedition-cta'))return;
    const faq=document.getElementById('faq');if(!faq)return;
    faq.insertAdjacentHTML('afterend','<aside id="custom-expedition-cta" class="mt-10 overflow-hidden rounded-2xl border border-summit/35 bg-[#2A211C] p-7 shadow-ember sm:p-9"><div class="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><p class="text-xs font-black uppercase tracking-[.18em] text-summit">Your objective, your pace</p><h3 class="mt-3 font-display text-3xl font-black uppercase leading-none text-white">Need a custom expedition?</h3><p class="mt-3 max-w-xl text-sm leading-relaxed text-white/65">Tell us your rough dates, experience, and the mountain that has your attention. We will help you find the right local team and next step.</p></div><button type="button" data-custom-inquiry class="shrink-0 rounded-full bg-summit px-6 py-3.5 text-xs font-black uppercase tracking-[.12em] text-white transition hover:bg-[#7A4323]">Request more information</button></div></aside>');
    document.querySelector('[data-custom-inquiry]')?.addEventListener('click',()=>{const modal=document.getElementById('inquiry-modal');if(!modal)return;modal.classList.remove('hidden');modal.classList.add('flex');document.body.classList.add('modal-open')});
  }
  function loadKilimanjaroMobileSupport(){
    if(!/\/(kilimanjaro|safari|volcan-de-fuego)(?:\.html)?\/?$/.test(location.pathname))return;
    if(!document.querySelector('link[href="/assets/kilimanjaro-mobile-tabs.css?v=20261108"]')){const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/kilimanjaro-mobile-tabs.css?v=20261108';document.head.append(style)}
    if(!document.querySelector('script[src="/assets/kilimanjaro-mobile-tabs.js?v=20261108"]')){const script=document.createElement('script');script.src='/assets/kilimanjaro-mobile-tabs.js?v=20261108';document.body.append(script)}
  }
  function loadSharedInquiry(){
    if(document.querySelector('script[src="/assets/shared-inquiry.js?v=portal-4"]'))return;
    const script=document.createElement('script');script.src='/assets/shared-inquiry.js?v=portal-4';document.body.append(script);
  }
  function loadAccountNavigation(){
    const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/account-navigation.css?v=portal-4';document.head.append(style);
    const script=document.createElement('script');script.src='/assets/account-navigation.js?v=portal-4';document.body.append(script);
  }
  function linkSafariCard(){
    if(!/\/(index\.html)?$/.test(location.pathname))return;
    const button=document.querySelector('.expedition-card [data-expedition="Wildlife Safari"]');
    if(button)button.outerHTML='<a href="/safari" class="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-summit hover:text-orange-300">View Safari <i data-lucide="arrow-up-right" class="h-4 w-4"></i></a>';
  }
  document.addEventListener('DOMContentLoaded',()=>{loadKilimanjaroMobileSupport();setNavigation();loadAccountNavigation();setFooterLogo();setFooters();setFaq();setContact();setHome();linkSafariCard();wireHomeInquiry();addHomeCta();loadSharedInquiry();window.lucide?.createIcons()});
})();

/* Volcán de Fuego is now a dedicated expedition page, not a home-page-only card. */
(function(){
  function setFuegoDestination(){
    document.querySelectorAll('a').forEach(link=>{
      if(link.textContent.trim()==='Volcán de Fuego')link.href='/volcan-de-fuego';
    });
    if(!/\/(index\.html)?$/.test(location.pathname))return;
    const card=[...document.querySelectorAll('.expedition-card')].find(item=>item.textContent.includes('Volcán de Fuego'));
    const action=card?.querySelector('[data-expedition^="Volcán de Fuego"]');
    if(action)action.outerHTML='<a href="/volcan-de-fuego" class="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-summit hover:text-orange-300">Explore trip <i data-lucide="arrow-up-right" class="h-4 w-4"></i></a>';
    if(card){
      [...card.querySelectorAll('span')].forEach(item=>{if(item.textContent.trim()==='3 Days')item.textContent='2 Days / 1 Night'});
      const description=[...card.querySelectorAll('p')].find(item=>item.textContent.includes('A highland ascent'));
      if(description)description.textContent='A two-day Acatenango overnight with an optional after-dark Fuego viewing trek, guided by a vetted local mountain team.';
      const inclusions=[...card.querySelectorAll('p')].find(item=>item.textContent.includes('private transfers'));
      if(inclusions)inclusions.innerHTML='<span class="font-bold text-white/80">Includes:</span> local transport, bilingual guide, park logistics, base-camp lodging, meals, and core cold-weather gear.';
      const price=[...card.querySelectorAll('p')].find(item=>item.textContent.includes('From $200'));
      if(price)price.innerHTML='From $110 <span class="font-medium text-white/50">/ climber</span>';
    }
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
    const card=document.querySelectorAll('.expedition-card')[2];
    const image=card?.querySelector('.card-image');
    if(image)image.style.backgroundImage="url('/assets/volcan-de-fuego-cone-eruption.png')";
  }
  document.addEventListener('DOMContentLoaded',()=>{updatePrepareLinks();updateFuegoCard()});
})();
