(function(){
  const wildlife=[
    ['elephant','Tarangire elephants','Tarangire is known for its large elephant herds, baobab country, giraffe, zebra, antelope, and a remarkable range of birdlife.'],
    ['lion','Ngorongoro predators','Ngorongoro Crater can bring lion, buffalo, hippo, hyena, elephant, and—with time and luck—black rhino into one concentrated ecosystem.'],
    ['giraffe','Serengeti plains life','The Serengeti adds giraffe, zebra, wildebeest, gazelle, predators, and seasonal migration movement across a huge, open landscape.']
  ];
  const card=([className,title,copy])=>`<article class="overflow-hidden rounded-xl border border-white/10 bg-white/[.03]"><div class="wildlife-visual ${className}" role="img" aria-label="${title}"></div><div class="p-6"><h3 class="font-black text-white">${title}</h3><p class="mt-3 text-sm leading-relaxed text-white/60">${copy}</p></div></article>`;
  const faq=`<details class="rounded-xl border border-white/10 bg-white/[.03] p-5"><summary class="flex cursor-pointer justify-between gap-5 font-black text-white">What wildlife can I expect to see?<i data-lucide="plus" class="chev h-5 w-5 shrink-0"></i></summary><div class="answer"><div class="pt-4 text-sm leading-relaxed text-white/65">Northern Tanzania is known for elephant, giraffe, zebra, wildebeest, buffalo, gazelle, antelope, baboon, blue monkey, hippo, hyena, and a broad range of birdlife. Tarangire, Ngorongoro, Lake Manyara, and the Serengeti each have a different rhythm; lions, leopards, black rhino, tree-climbing lions, and migration scenes are possible but never guaranteed. Your local guide follows current conditions and animal movement to make the most of the day.</div></div></details>`;
  document.addEventListener('DOMContentLoaded',()=>{
    const overview=document.querySelector('[data-panel="overview"]');
    const benefits=overview?.querySelector('.mt-14');
    if(benefits)benefits.insertAdjacentHTML('beforebegin',`<section class="mt-14"><div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p class="text-xs font-black uppercase tracking-[.2em] text-summit">Wildlife, not a checklist</p><h2 class="mt-3 font-display text-3xl font-black uppercase leading-none tracking-[-.04em] text-white sm:text-4xl">What you may see.</h2></div><p class="max-w-xl text-sm leading-relaxed text-white/60">Every day is different. These are the animals and environments the route is built around, with sightings guided by the season, weather, and wild movement.</p></div><div class="mt-8 grid gap-4 md:grid-cols-3">${wildlife.map(card).join('')}</div></section>`);
    const faqPanel=document.querySelector('[data-panel="faq"] .space-y-3');
    if(faqPanel)faqPanel.insertAdjacentHTML('afterbegin',faq);
    window.lucide?.createIcons();
  });
})();
