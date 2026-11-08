(() => {
  const init = () => {
    window.lucide?.createIcons();
    const nav = document.getElementById('site-nav');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (nav) window.addEventListener('scroll', () => nav.classList.toggle('nav-scrolled', window.scrollY > 20), { passive: true });
    menuToggle?.addEventListener('click', () => {
      const open = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden', open);
      menuToggle.setAttribute('aria-expanded', String(!open));
    });
    mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuToggle?.setAttribute('aria-expanded', 'false');
    }));
    const tabs = [...document.querySelectorAll('[data-tab]')];
    const panels = [...document.querySelectorAll('[data-panel]')];
    tabs.forEach(tab => tab.addEventListener('click', () => {
      tabs.forEach(item => item.setAttribute('aria-selected', 'false'));
      panels.forEach(panel => { panel.classList.add('hidden'); panel.classList.remove('panel'); });
      tab.setAttribute('aria-selected', 'true');
      const target = document.querySelector(`[data-panel="${tab.dataset.tab}"]`);
      if (!target) return;
      target.classList.remove('hidden');
      target.classList.add('panel');
      const offset = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 136);
      window.scrollTo({ top: offset, behavior: 'smooth' });
      window.lucide?.createIcons();
    }));
    document.querySelectorAll('.route-side a').forEach(link => link.addEventListener('click', () => {
      const owner = link.closest('.route-side');
      owner?.querySelectorAll('a').forEach(item => item.classList.remove('active'));
      link.classList.add('active');
    }));
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();

/* Keep the equipment decision clear: what the expedition supplies, what the climber owns, and what can be rented. */
(() => {
  const refineFuegoContent = () => {
    const gear = document.querySelector('[data-panel="gear"]');
    if (gear) gear.innerHTML = `
      <div class="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <div><p class="text-xs font-black uppercase tracking-[.2em] text-summit">Volcano gear list</p><h2 class="mt-4 font-display font-black uppercase text-white">Layer for<br/>the dark.</h2></div>
        <div><p class="max-w-2xl text-base leading-relaxed text-white/70">There are three simple buckets for this trip: what is already handled at camp, what belongs in your own pack, and what can be rented or carried if you do not own it. Nothing should be a surprise at the trailhead.</p><div class="mt-6 rounded-xl border border-summit/30 bg-summit/10 p-5"><p class="text-xs font-black uppercase tracking-[.16em] text-summit">The overnight rule</p><p class="mt-2 text-sm font-semibold leading-relaxed text-white">Pack for exposed cold and a pre-dawn summit—not only the warm first hour of the climb.</p></div></div>
      </div>
      <div class="mt-10 grid gap-5 xl:grid-cols-3">
        <section class="gear-category bg-summit/10"><div class="flex items-center gap-3"><i data-lucide="badge-check" class="h-6 w-6 text-summit"></i><p class="text-[10px] font-black uppercase tracking-[.16em] text-summit">Already provided</p></div><h3 class="mt-5">Your mountain team supplies</h3><p class="mt-3 text-sm leading-relaxed text-white/65">These are included or coordinated as part of the standard overnight:</p><ul class="mt-5 list-disc space-y-2 pl-5 text-sm text-white/70 marker:text-summit"><li>Round-trip local transport from the confirmed Antigua meeting point</li><li>Bilingual local mountain guide, permits, locker access, and complete scheduled meals</li><li>Base-camp cabin, mattress, sleeping bag, blanket, and pillow</li><li>Jacket, warm hat, and gloves when needed from the core cold-weather system</li></ul></section>
        <section class="gear-category"><div class="flex items-center gap-3"><i data-lucide="backpack" class="h-6 w-6 text-summit"></i><p class="text-[10px] font-black uppercase tracking-[.16em] text-summit">Bring yourself</p></div><h3 class="mt-5">Your personal kit</h3><div class="mt-5 grid gap-5 text-sm text-white/70 sm:grid-cols-2 xl:grid-cols-1"><div><p class="font-black text-white">Wear & protect</p><ul class="mt-2 list-disc space-y-2 pl-5 marker:text-summit"><li>Thermal layers, spare shirt and socks</li><li>Buff, sun hat, sunglasses, sun protection</li><li>Broken-in hiking boots or trail shoes</li></ul></div><div><p class="font-black text-white">Carry & move</p><ul class="mt-2 list-disc space-y-2 pl-5 marker:text-summit"><li>40–50 L hiking pack</li><li>Four liters of water and personal snacks</li><li>Trekking poles and a headlamp with fresh batteries</li></ul></div></div></section>
        <section class="gear-category"><div class="flex items-center gap-3"><i data-lucide="handshake" class="h-6 w-6 text-summit"></i><p class="text-[10px] font-black uppercase tracking-[.16em] text-summit">Optional rentals & support</p></div><h3 class="mt-5">Use help when it helps</h3><p class="mt-3 text-sm leading-relaxed text-white/65">Do not buy unfamiliar gear just for one weekend. Ask us to confirm the items below before you travel.</p><ul class="mt-5 list-disc space-y-2 pl-5 text-sm text-white/70 marker:text-summit"><li>Rental availability may include headlamps, trekking poles, pants, hiking shoes, and backpacks</li><li>Porter support can carry up to 12 kg of heavier kit; arrange it in advance through Outland</li><li>The optional Fuego night trek needs one extra liter of water and additional personal snacks</li></ul><a class="mt-6 inline-flex text-xs font-black uppercase tracking-[.12em] text-summit hover:text-[#D68456]" href="/contact">Ask about gear support →</a></section>
      </div>
      <p class="mt-7 max-w-4xl text-sm leading-relaxed text-white/55">Your final pre-trip note confirms current weather adjustments, rental availability, and whether the Fuego extension changes what you should carry.</p>`;

    const fuegoCopy = document.querySelector('#fuego-extension .mt-6 > p');
    if (fuegoCopy) fuegoCopy.innerHTML = `<strong class="text-white">This is the close-up version of the experience.</strong> From Acatenango camp, Fuego is a powerful but distant view across the valley. The optional night trek moves through volcanic terrain toward a guide-selected eruption-viewing zone, giving you a far more immediate sense of the mountain’s sound, heat, and movement. The local operating plan places the viewing area much closer than camp—roughly 300 meters when conditions and access allow—while still following the guide’s safety call. Plan on about four demanding hours, 6 km round trip, an additional liter of water, and personal snacks.`;
    window.lucide?.createIcons();
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', refineFuegoContent) : refineFuegoContent();
})();
