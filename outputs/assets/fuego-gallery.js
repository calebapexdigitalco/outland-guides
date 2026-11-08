(() => {
  const photos = [
    { src: 'assets/fuego-gallery-night-eruption.jpeg', alt: 'Volcán de Fuego erupting beneath a star-filled sky', title: 'Fuego after dark', detail: 'The cone under a clear night sky.' },
    { src: 'assets/fuego-gallery-daytime-fuego.jpg', alt: 'Volcán de Fuego releasing a plume above the cloud forest', title: 'Daylight plume', detail: 'A sharp cone and a changing sky.' },
    { src: 'assets/fuego-gallery-pine-sunrise.jpg', alt: 'Volcán de Fuego framed by pine trees at sunrise', title: 'First light', detail: 'The view from Acatenango country.' },
    { src: 'assets/fuego-gallery-camp.jpg', alt: 'Tent camp in the Acatenango forest', title: 'High camp', detail: 'A night outside, properly layered.' },
    { src: 'assets/fuego-gallery-misty-hike.jpg', alt: 'Hiker walking through mist on volcanic terrain', title: 'In the weather', detail: 'The mountain changes by the hour.' },
    { src: 'assets/fuego-gallery-lava-long-exposure.jpg', alt: 'Long exposure of Volcán de Fuego erupting with glowing lava trails', title: 'Living mountain', detail: 'A night eruption in motion.' },
    { src: 'assets/fuego-gallery-trail-selfie.jpg', alt: 'Hiker with Volcán de Fuego behind him on the trail', title: 'On the trail', detail: 'A close look at the volcano country.' },
    { src: 'assets/fuego-gallery-antigua-mural.jpg', alt: 'Hiker at an I Love Alatenango mural in Guatemala', title: 'Before the climb', detail: 'A local stop on the way into the highlands.' }
  ];

  const init = () => {
    const tabList = document.querySelector('[role="tablist"]');
    const content = document.querySelector('[data-panel="faq"]')?.parentElement;
    const overview = document.querySelector('[data-panel="overview"]');
    if (!tabList || !content || !overview) return;

    const galleryTab = document.createElement('button');
    galleryTab.className = 'tab whitespace-nowrap px-5 py-5 text-xs font-black uppercase tracking-[.12em] text-white/60';
    galleryTab.dataset.tab = 'gallery';
    galleryTab.setAttribute('aria-selected', 'false');
    galleryTab.textContent = 'Gallery';
    tabList.append(galleryTab);

    const gallery = document.createElement('div');
    gallery.className = 'panel hidden';
    gallery.dataset.panel = 'gallery';
    gallery.innerHTML = `
      <div>
        <div class="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div><p class="text-xs font-black uppercase tracking-[.2em] text-summit">From the Fuego field</p><h2 class="mt-4 font-display text-5xl font-black uppercase leading-[.86] tracking-[-.04em] text-white sm:text-6xl">See the
          <br/>mountain move.</h2></div>
          <p class="max-w-2xl self-end text-base leading-relaxed text-white/70">A few honest frames from the route: cloud forest, high camp, volcanic trail, and the moments Fuego takes over the sky. Select any image for a full-screen view.</p>
        </div>
        <div class="fuego-gallery-grid mt-10">${photos.map((photo, index) => `<button type="button" class="fuego-gallery-card" data-fuego-photo="${index}" aria-label="Open photo: ${photo.title}"><img src="${photo.src}" alt="${photo.alt}" loading="lazy" /><span class="fuego-gallery-caption">${photo.title}<span>${photo.detail}</span></span></button>`).join('')}</div>
      </div>`;
    content.append(gallery);

    overview.insertAdjacentHTML('beforeend', `
      <section class="fuego-carousel" aria-label="Volcán de Fuego photo carousel">
        <div class="fuego-carousel-stage">
          <button type="button" class="fuego-carousel-control prev" data-carousel-direction="previous" aria-label="Previous photo"><i data-lucide="arrow-left" class="h-4 w-4"></i></button>
          <button type="button" class="fuego-carousel-control next" data-carousel-direction="next" aria-label="Next photo"><i data-lucide="arrow-right" class="h-4 w-4"></i></button>
          <button type="button" class="block h-full w-full" data-fuego-photo="0" aria-label="Open photo: ${photos[0].title}"><img data-carousel-image src="${photos[0].src}" alt="${photos[0].alt}" /><span class="fuego-carousel-copy"><p>Field notes</p><p data-carousel-title>${photos[0].title}</p></span></button>
        </div>
        <div class="fuego-carousel-thumbs" role="tablist" aria-label="Choose a Fuego field photo">${photos.map((photo, index) => `<button type="button" class="fuego-carousel-thumb${index === 0 ? ' is-active' : ''}" data-carousel-index="${index}" aria-label="View ${photo.title}" aria-selected="${index === 0}"><img src="${photo.src}" alt="" loading="lazy" /></button>`).join('')}</div>
      </section>`);

    const lightbox = document.createElement('div');
    lightbox.className = 'fuego-lightbox';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Expanded Volcán de Fuego photo');
    lightbox.innerHTML = '<div class="fuego-lightbox-frame"><img src="" alt="" /><button type="button" class="fuego-lightbox-close" aria-label="Close photo"><i data-lucide="x" class="h-5 w-5"></i></button></div>';
    document.body.append(lightbox);

    let activeIndex = 0;
    const carouselImage = overview.querySelector('[data-carousel-image]');
    const carouselTitle = overview.querySelector('[data-carousel-title]');
    const stageButton = overview.querySelector('[data-fuego-photo]');
    const thumbs = [...overview.querySelectorAll('[data-carousel-index]')];
    const selectPhoto = index => {
      activeIndex = (index + photos.length) % photos.length;
      const photo = photos[activeIndex];
      carouselImage.src = photo.src;
      carouselImage.alt = photo.alt;
      carouselTitle.textContent = photo.title;
      stageButton.dataset.fuegoPhoto = activeIndex;
      thumbs.forEach((thumb, thumbIndex) => {
        const isActive = thumbIndex === activeIndex;
        thumb.classList.toggle('is-active', isActive);
        thumb.setAttribute('aria-selected', String(isActive));
      });
    };
    const openLightbox = index => {
      const photo = photos[index];
      const image = lightbox.querySelector('img');
      image.src = photo.src;
      image.alt = photo.alt;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('.fuego-lightbox-close').focus();
    };
    const closeLightbox = () => {
      lightbox.hidden = true;
      document.body.style.overflow = '';
    };

    document.addEventListener('click', event => {
      const photoButton = event.target.closest('[data-fuego-photo]');
      if (photoButton) openLightbox(Number(photoButton.dataset.fuegoPhoto));
    });
    overview.querySelectorAll('[data-carousel-index]').forEach(thumb => thumb.addEventListener('click', () => selectPhoto(Number(thumb.dataset.carouselIndex))));
    overview.querySelectorAll('[data-carousel-direction]').forEach(control => control.addEventListener('click', event => {
      event.stopPropagation();
      selectPhoto(activeIndex + (control.dataset.carouselDirection === 'next' ? 1 : -1));
    }));
    lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
    lightbox.querySelector('.fuego-lightbox-close').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

    const standardTabs = [...tabList.querySelectorAll('[data-tab]')].filter(tab => tab !== galleryTab);
    const showPanel = tabName => {
      [...content.querySelectorAll('[data-panel]')].forEach(panel => {
        const current = panel.dataset.panel === tabName;
        panel.classList.toggle('hidden', !current);
        panel.classList.toggle('panel', current);
      });
      [...tabList.querySelectorAll('[data-tab]')].forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.tab === tabName)));
      const target = content.querySelector(`[data-panel="${tabName}"]`);
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 136);
      window.scrollTo({ top, behavior: 'smooth' });
      window.lucide?.createIcons();
    };
    galleryTab.addEventListener('click', () => showPanel('gallery'));
    standardTabs.forEach(tab => tab.addEventListener('click', () => {
      gallery.classList.add('hidden');
      gallery.classList.remove('panel');
      galleryTab.setAttribute('aria-selected', 'false');
    }));
    window.lucide?.createIcons();
  };

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
