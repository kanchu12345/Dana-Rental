// Main interactive script for Danan Car & Bike Rentals public website
import { 
  getDoc, 
  getCollection, 
  escapeHTML, 
  sanitizeHTML, 
  sanitizeCSSUrl, 
  normalizeWhatsAppNumber, 
  sanitizeTel, 
  sanitizeMailto, 
  fixImgPath, 
  saveDoc 
} from './db.js';

// Feature Flag: Show vehicles with dynamic AVAILABLE / UNAVAILABLE badge from admin data
export const SHOW_UNAVAILABLE_AS_BOOKED = true;

async function initApp() {
  initHeroTabSwitcher();
  initCurrentYear();
  initTestimonialsCarousel();
  initWhyCarousel();
  initTapToInteractMaps();
  initScrollAndMobileListeners();
  initScrollReveal();
  initFlatpickrDates();
  initBookingInquiryModal();
  initVideoLightboxModal();
  
  try { await loadSiteSettings(); } catch (e) { console.warn('loadSiteSettings error:', e); }
  try { await applyDynamicBackgrounds(); } catch (e) { console.warn('applyDynamicBackgrounds error:', e); }
  try { await loadHomePageData(); } catch (e) { console.warn('loadHomePageData error:', e); }
  try { await loadAboutPageData(); } catch (e) { console.warn('loadAboutPageData error:', e); }
  try { await loadDestinationsPageData(); } catch (e) { console.warn('loadDestinationsPageData error:', e); }
  try { await loadBookingsPageData(); } catch (e) { console.warn('loadBookingsPageData error:', e); }
  try { await loadContactPageData(); } catch (e) { console.warn('loadContactPageData error:', e); }
  try { await loadVehiclesGrid(); } catch (e) { console.warn('loadVehiclesGrid error:', e); }
  try { await loadRulesAndFaqs(); } catch (e) { console.warn('loadRulesAndFaqs error:', e); }
  try { await loadReviewsTrack(); } catch (e) { console.warn('loadReviewsTrack error:', e); }
  try { await initCustomerGallerySwap(); } catch (e) { console.warn('initCustomerGallerySwap error:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// SCROLL REVEAL ANIMATIONS
function initScrollReveal() {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in', 'visible'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in', 'visible');
        }
      });
    }, { threshold: 0.05 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
}

// FLATPICKR DATEPICKER ANIMATIONS
function initFlatpickrDates() {
  if (typeof flatpickr !== 'undefined') {
    flatpickr('.datepicker', {
      enableTime: false,
      dateFormat: "Y-m-d",
      minDate: "today",
      altInput: true,
      altFormat: "F j, Y",
      theme: "dark"
    });
  }
}

// SCROLL & MOBILE LISTENERS
function initScrollAndMobileListeners() {
  const navbar = document.getElementById('navbar');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    if (navbar) {
      if (scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    if (scrollTopBtn) {
      if (scrollY > 300) {
        scrollTopBtn.classList.add('show', 'visible');
      } else {
        scrollTopBtn.classList.remove('show', 'visible');
      }
    }
  });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');

  function openMobileMenu() {
    mobileMenu?.classList.add('active');
    mobileOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileMenu?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  menuToggle?.addEventListener('click', openMobileMenu);
  menuClose?.addEventListener('click', closeMobileMenu);
  mobileOverlay?.addEventListener('click', closeMobileMenu);

  // Close mobile menu on tapping any navigation link
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close mobile menu and modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      if (typeof window.closeBookingModal === 'function') {
        window.closeBookingModal();
      }
      if (typeof window.closeVideoModal === 'function') {
        window.closeVideoModal();
      }
    }
  });
}

// VEHICLE CATEGORY SELECTOR & FILTER (IMAGE 2 DESIGN)
function initHeroTabSwitcher() {
  const catItems = document.querySelectorAll('.category-item, .hero-tab');
  const fleetCountText = document.getElementById('fleetCountText');

  function filterFleet(cat) {
    const category = (cat || 'all').toLowerCase();
    
    // 1. If dynamic database fleet is loaded
    if (window.allVehiclesData && Array.isArray(window.allVehiclesData) && window.allVehiclesData.length > 0) {
      let filtered = [];
      if (category === 'all') {
        filtered = window.allVehiclesData;
      } else if (category === 'scooter') {
        filtered = window.allVehiclesData.filter(v => {
          const name = (v.name || '').toLowerCase();
          const type = (v.type || '').toLowerCase();
          return type.includes('scooter') || name.includes('dio') || name.includes('ntorq') || type.includes('bike');
        });
      } else if (category === 'cars') {
        filtered = window.allVehiclesData.filter(v => {
          const name = (v.name || '').toLowerCase();
          const type = (v.type || '').toLowerCase();
          return type.includes('car') || name.includes('alto') || name.includes('wagon') || name.includes('hybrid');
        });
      } else if (category === 'vans') {
        filtered = window.allVehiclesData.filter(v => {
          const name = (v.name || '').toLowerCase();
          const type = (v.type || '').toLowerCase();
          return type.includes('van') || name.includes('every') || name.includes('buddy');
        });
      } else if (category === 'bikes') {
        filtered = window.allVehiclesData.filter(v => {
          const name = (v.name || '').toLowerCase();
          const type = (v.type || '').toLowerCase();
          return type.includes('bike') || name.includes('motor');
        });
      } else if (category === 'tuktuk') {
        filtered = window.allVehiclesData.filter(v => {
          const name = (v.name || '').toLowerCase();
          const type = (v.type || '').toLowerCase();
          return type.includes('tuk') || name.includes('three');
        });
      } else if (category === 'cycle') {
        filtered = window.allVehiclesData.filter(v => {
          const name = (v.name || '').toLowerCase();
          const type = (v.type || '').toLowerCase();
          return type.includes('cycle') || name.includes('bicycle');
        });
      } else {
        filtered = window.allVehiclesData.filter(v => (v.type || '').toLowerCase().includes(category));
      }

      renderVehiclesList(filtered, category);
      if (typeof window.initFleetCarousel === 'function') {
        setTimeout(window.initFleetCarousel, 50);
      }
    } else {
      // 2. Static HTML fallback cards
      const cards = document.querySelectorAll('#featuredVehiclesGrid .rc');
      let visibleCount = 0;
      cards.forEach(card => {
        const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
        const cardText = card.textContent.toLowerCase();
        let match = false;
        if (category === 'all') {
          match = true;
        } else if (category === 'scooter' && (cardCat === 'scooter' || cardText.includes('dio') || cardText.includes('ntorq'))) {
          match = true;
        } else if (category === 'cars' && (cardCat === 'cars' || cardText.includes('alto') || cardText.includes('wagon'))) {
          match = true;
        } else if (category === 'vans' && (cardCat === 'vans' || cardText.includes('every') || cardText.includes('van'))) {
          match = true;
        } else if (category === 'bikes' && (cardCat === 'bikes' || cardText.includes('bike'))) {
          match = true;
        } else if (category === 'tuktuk' && (cardCat === 'tuktuk' || cardText.includes('tuk'))) {
          match = true;
        } else if (category === 'cycle' && (cardCat === 'cycle' || cardText.includes('cycle'))) {
          match = true;
        }

        if (match) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      updateFleetCountLabel(visibleCount, category);
      if (typeof window.initFleetCarousel === 'function') {
        setTimeout(window.initFleetCarousel, 50);
      }
    }
  }

  function updateFleetCountLabel(count, cat) {
    if (!fleetCountText) return;
    const catMap = {
      all: 'Vehicles',
      scooter: 'Scooters',
      cars: 'Cars',
      vans: 'Vans',
      bikes: 'Motor Bikes',
      tuktuk: 'Tuk Tuks',
      cycle: 'Bicycles'
    };
    const name = catMap[cat] || 'Vehicles';
    if (count > 0) {
      fleetCountText.textContent = `${count} ${name} Available`;
    } else {
      fleetCountText.textContent = `Inquire for ${name}`;
    }
  }

  catItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      catItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const cat = item.getAttribute('data-category') || item.getAttribute('data-tab') || 'all';
      filterFleet(cat);
    });
  });

  // Filter Drawer Toggle
  const btnToggleFilters = document.getElementById('btnToggleFilters');
  const categoryFilterDrawer = document.getElementById('categoryFilterDrawer');
  if (btnToggleFilters && categoryFilterDrawer) {
    btnToggleFilters.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = categoryFilterDrawer.style.display === 'none' || !categoryFilterDrawer.style.display;
      if (isHidden) {
        categoryFilterDrawer.style.display = 'block';
        btnToggleFilters.classList.add('active');
        btnToggleFilters.setAttribute('aria-expanded', 'true');
      } else {
        categoryFilterDrawer.style.display = 'none';
        btnToggleFilters.classList.remove('active');
        btnToggleFilters.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Search Fleet Button inside Filter Drawer
  const btnHeroSearch = document.getElementById('btnHeroSearch');
  if (btnHeroSearch) {
    btnHeroSearch.addEventListener('click', (e) => {
      e.preventDefault();
      const driver = document.getElementById('driverType')?.value || 'Self Drive';
      const start = document.getElementById('home-startdate')?.value || '';
      const end = document.getElementById('home-enddate')?.value || '';

      try {
        sessionStorage.setItem('danan_search_prefill', JSON.stringify({ driver, start, end }));
      } catch (err) {}

      const rentalsEl = document.getElementById('rentals');
      if (rentalsEl) {
        rentalsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

// LOAD GLOBAL SITE SETTINGS (Single Source of Truth)
async function loadSiteSettings() {
  const settings = await getDoc('settings', 'site') || {};
  window.siteSettings = settings;

  // 1. Favicon
  if (settings.favicon) {
    let faviconLink = document.querySelector("link[rel='icon']");
    if (faviconLink) faviconLink.href = settings.favicon;
  }

  // 2. Business / Website Name & Logos
  if (settings.businessName) {
    const nameStr = String(settings.businessName).trim();
    const parts = nameStr.split(' ');
    const firstWord = parts[0] || '';
    const restWords = parts.slice(1).join(' ') || '';

    // Update navigation brand titles
    document.querySelectorAll('.nav-brand-title').forEach(el => {
      el.innerHTML = `${escapeHTML(firstWord)} <span>${escapeHTML(restWords)}</span>`;
    });

    // Update footer brand & copyright text
    document.querySelectorAll('.footer-bottom span:first-child, .copyright-text').forEach(el => {
      el.innerHTML = `&copy; ${new Date().getFullYear()} ${escapeHTML(nameStr)}. All Rights Reserved.`;
    });

    // Update public page document titles
    if (document.title && document.title.includes('|')) {
      const prefix = document.title.split('|')[0].trim();
      document.title = `${prefix} | ${nameStr}`;
    }
  }

  const logoImgs = document.querySelectorAll('.nav-logo img, .footer-logo img');
  logoImgs.forEach(img => {
    if (settings.logo) img.src = settings.logo;
    img.alt = settings.businessName || 'Danan Rentals';
  });

  // 3. Theme colors override
  if (settings.theme && settings.theme.primaryRed) {
    document.documentElement.style.setProperty('--primary-red', settings.theme.primaryRed);
  }

  // 4. WhatsApp Number Normalization (Default 94772013059)
  const normWa = normalizeWhatsAppNumber(settings.whatsapp || '94772013059');
  const waBtn = document.getElementById('waBtn');
  if (waBtn) {
    waBtn.href = `https://wa.me/${normWa}?text=${encodeURIComponent('Hello Danan Rentals, I want to rent a vehicle.')}`;
  }

  // 5. Update wa.me links everywhere on the page
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    try {
      const url = new URL(link.href);
      const textParam = url.searchParams.get('text');
      const newUrl = `https://wa.me/${normWa}${textParam ? '?text=' + encodeURIComponent(textParam) : ''}`;
      link.href = newUrl;
    } catch (e) {
      link.href = `https://wa.me/${normWa}`;
    }
  });

  // 6. Phones & Email
  const primaryPhone = Array.isArray(settings.phones) && settings.phones.length > 0 
    ? settings.phones[0] 
    : (settings.phones || '077 201 3059');
  
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.href = `tel:${sanitizeTel(primaryPhone)}`;
  });

  const email = settings.email || 'dananrentals@gmail.com';
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.href = `mailto:${sanitizeMailto(email)}`;
  });

  // 7. Dynamic Social Media Links (Configurable via Admin Panel)
  const socials = settings.socials || {};
  const fbUrl = (settings.facebook || socials.facebook || '').trim();
  const taUrl = (settings.tripadvisor || socials.tripadvisor || '').trim();
  const igUrl = (settings.instagram || socials.instagram || '').trim();
  const waUrl = (settings.whatsappLink || socials.whatsapp || `https://wa.me/${normWa}`).trim();
  const ytUrl = (settings.youtube || socials.youtube || '').trim();
  const ttUrl = (settings.tiktok || socials.tiktok || '').trim();

  function updateSocialIcon(selectors, url, fallbackDefault = '') {
    const finalUrl = (url && url !== '#' && !url.includes('TODO_REPLACE')) ? url : fallbackDefault;
    const elements = document.querySelectorAll(selectors);
    elements.forEach(el => {
      if (finalUrl) {
        el.href = finalUrl;
        el.style.display = 'inline-flex';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // Update all social channel icon buttons
  updateSocialIcon('#footerFbLink, a.soc-icon-btn[aria-label*="Facebook"]', fbUrl, 'https://www.facebook.com/');
  updateSocialIcon('#footerTripadvisorLink, a.soc-icon-btn[aria-label*="TripAdvisor"]', taUrl, 'https://www.tripadvisor.com/');
  updateSocialIcon('#footerInstagramLink, a.soc-icon-btn[aria-label*="Instagram"]', igUrl, '');
  updateSocialIcon('#footerWaLink, a.soc-icon-btn[aria-label*="WhatsApp"]', waUrl, `https://wa.me/${normWa}`);
  updateSocialIcon('#footerYoutubeLink, a.soc-icon-btn[aria-label*="YouTube"]', ytUrl, '');
  updateSocialIcon('#footerTiktokLink, a.soc-icon-btn[aria-label*="TikTok"]', ttUrl, '');
}

// DYNAMIC WEBSITE BACKGROUNDS MANAGER
async function applyDynamicBackgrounds() {
  try {
    const bgData = await getDoc('backgrounds', 'main') || await getDoc('settings', 'backgrounds');
    if (!bgData) return;

    const isSub = typeof window !== 'undefined' && window.location.pathname.includes('/admin/');
    const resolveBg = (val) => {
      if (!val) return '';
      // Map old image with baked-in text to new clean vehicle background banner
      if (typeof val === 'string' && val.includes('ngrur9zmmagohv7onewu')) {
        return 'https://res.cloudinary.com/ygkhhyaj/image/upload/v1792130030/ab99ty8o75qbjqj9wj3l.png';
      }
      return sanitizeCSSUrl(fixImgPath(val, isSub));
    };

    const applyBg = (el, bgValue, gradientPrefix = null) => {
      if (!el || !bgValue) return;
      const resolved = resolveBg(bgValue);
      if (!resolved) return;
      if (gradientPrefix) {
        el.style.backgroundImage = `${gradientPrefix}, url('${resolved}')`;
      } else {
        el.style.backgroundImage = `url('${resolved}')`;
      }
      el.style.backgroundRepeat = 'no-repeat';
      // Ensure background-size and responsive background-position are preserved from CSS
      if (!el.style.backgroundSize) el.style.backgroundSize = 'cover';
    };

    // 1. Home Hero (index.html)
    if (bgData.homeHero) {
      const resolved = resolveBg(bgData.homeHero);
      const artworkImg = document.getElementById('heroArtworkImg');
      if (artworkImg && resolved) {
        artworkImg.src = resolved;
      }
      const mobileBannerImg = document.getElementById('heroMobileBannerImg');
      if (mobileBannerImg && resolved) {
        mobileBannerImg.src = resolved;
      }
    }

    // 2. Our Fleet Hero (vehicles.html)
    if (bgData.fleetHero) {
      applyBg(document.querySelector('.rental-hero'), bgData.fleetHero);
    }

    // 3. Bookings Hero (bookings.html)
    if (bgData.bookingsHero) {
      applyBg(document.querySelector('.bookings-hero'), bgData.bookingsHero);
    }

    // 4. Bookings CTA Banner (bookings.html)
    if (bgData.bookingsCta) {
      applyBg(document.querySelector('.bookings-cta-banner:not(.destinations-cta-banner)'), bgData.bookingsCta);
    }

    // 5. Destinations Hero (destinations.html)
    if (bgData.destinationsHero) {
      applyBg(document.querySelector('.destinations-hero'), bgData.destinationsHero);
    }

    // 6. Destinations CTA Banner (destinations.html)
    const destCtaUrl = bgData.destinationsCta || bgData.bookingsCta;
    if (destCtaUrl) {
      applyBg(document.querySelector('.destinations-cta-banner'), destCtaUrl);
    }

    // 7. About Us Hero (about.html)
    if (bgData.aboutHero) {
      applyBg(document.querySelector('.about-hero'), bgData.aboutHero);
    }

    // 8. About Us Intro / Story Parallax (about.html)
    if (bgData.aboutIntro) {
      applyBg(document.querySelector('.about-intro'), bgData.aboutIntro);
    }

    // 9. About Us CTA Banner (about.html)
    if (bgData.aboutCta) {
      applyBg(document.querySelector('.about-cta-banner'), bgData.aboutCta);
    }

    // 10. Contact Us Hero (contact.html)
    if (bgData.contactHero) {
      applyBg(document.querySelector('.contact-hero'), bgData.contactHero);
    }

    // 11. Contact Us CTA Banner (contact.html)
    if (bgData.contactCta) {
      applyBg(document.querySelector('.contact-cta-banner'), bgData.contactCta);
    }

    // 12. FAQ Top Guidance Banner (faqs.html)
    if (bgData.faqsHero) {
      applyBg(document.querySelector('.faqs-hero-banner'), bgData.faqsHero, 'linear-gradient(rgba(10, 10, 10, 0.82), rgba(10, 10, 10, 0.92))');
    }
  } catch (err) {
    console.warn('Dynamic background styling error:', err);
  }
}

// LOAD HOME PAGE DATA
async function loadHomePageData() {
  const homeData = await getDoc('pages', 'home');
  if (!homeData) return;

  if (homeData.hero) {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && homeData.hero.headline) {
      let hl = homeData.hero.headline;
      // Auto-correct common typo 'journy' -> 'Journey'
      hl = hl.replace(/journy/gi, 'Journey');
      if (/Your Journey/i.test(hl) && /Your Choice/i.test(hl)) {
        hl = '<span class="hero-title-main">Your Journey,</span> <span class="hero-title-highlight">Your Choice</span>';
      } else if (/Car & Bike Rentals/i.test(hl)) {
        const sub = hl.replace(/Car & Bike Rentals/i, '').replace(/in/i, '').trim();
        hl = `<span class="hero-title-main">Car &amp; Bike Rentals</span> <span class="hero-title-highlight">${sub ? 'In ' + sub : 'In Kandy'}</span>`;
      } else if (!hl.includes('<span') && !hl.includes('<br>')) {
        const words = hl.split(' ');
        if (words.length > 2) {
          const mid = Math.ceil(words.length / 2);
          hl = `<span class="hero-title-main">${words.slice(0, mid).join(' ')}</span> <span class="hero-title-highlight">${words.slice(mid).join(' ')}</span>`;
        } else {
          hl = `<span class="hero-title-main">${words[0]}</span> <span class="hero-title-highlight">${words.slice(1).join(' ')}</span>`;
        }
      }
      document.querySelectorAll('.hero-title').forEach(t => {
        t.innerHTML = sanitizeHTML(hl);
      });
    }

    if (homeData.hero.subline) {
      document.querySelectorAll('.hero-desc').forEach(d => {
        d.textContent = homeData.hero.subline;
      });
    }

    if (homeData.hero.bgImage) {
      let bgVal = homeData.hero.bgImage;
      if (typeof bgVal === 'string' && bgVal.includes('ngrur9zmmagohv7onewu')) {
        bgVal = 'https://res.cloudinary.com/ygkhhyaj/image/upload/v1792130030/ab99ty8o75qbjqj9wj3l.png';
      }
      const cleanBg = sanitizeCSSUrl(bgVal);
      const artworkImg = document.getElementById('heroArtworkImg');
      if (artworkImg && cleanBg) {
        artworkImg.src = cleanBg;
      }
      const mobileBannerImg = document.getElementById('heroMobileBannerImg');
      if (mobileBannerImg && cleanBg) {
        mobileBannerImg.src = cleanBg;
      }
    }
  }

  // Why choose us items
  if (homeData.whyChooseUs && Array.isArray(homeData.whyChooseUs.items) && homeData.whyChooseUs.items.length >= 8) {
    const whyTrack = document.getElementById('whyTrack');
    if (whyTrack) {
      whyTrack.innerHTML = homeData.whyChooseUs.items.map(item => `
        <div class="why-item">
          <div class="why-icon-box"><i class="fa-solid ${escapeHTML(item.icon || 'fa-trophy')}"></i></div>
          <h4>${escapeHTML(item.title)}</h4>
          <p>${escapeHTML(item.description)}</p>
        </div>
      `).join('');
    }
  }
  // Re-initialize / ensure Why Choose Us auto-swap carousel is actively running
  try { initWhyCarousel(); } catch (e) { console.warn('initWhyCarousel error:', e); }

  // Home About Text (Why Drivers Choose Our Fleet)
  if (homeData.about) {
    const aboutTitle = document.querySelector('.about-row:first-child .about-text-col h3');
    if (aboutTitle && homeData.about.title) aboutTitle.textContent = homeData.about.title;
    const aboutDesc = document.querySelector('.about-row:first-child .about-text-col p');
    if (aboutDesc && homeData.about.description) aboutDesc.textContent = homeData.about.description;
  }

  // Home Mission & Heritage
  if (homeData.mission) {
    const mTitle = document.getElementById('missionTitle');
    if (mTitle && homeData.mission.title) mTitle.textContent = homeData.mission.title;
    const mDesc = document.getElementById('missionDesc');
    if (mDesc && homeData.mission.description) mDesc.textContent = homeData.mission.description;
    const mMainImg = document.getElementById('missionImgMain');
    if (mMainImg && homeData.mission.mainImage) mMainImg.src = fixImgPath(homeData.mission.mainImage, false);
    const mOverlayImg = document.getElementById('missionImgOverlay');
    if (mOverlayImg && homeData.mission.overlayImage) mOverlayImg.src = fixImgPath(homeData.mission.overlayImage, false);
  }

  // 4-Step Process Strip (How It Works)
  if (homeData.steps && Array.isArray(homeData.steps) && homeData.steps.length > 0) {
    const stepStrips = document.querySelectorAll('#how-it-works .gallery-strip');
    homeData.steps.forEach((st, idx) => {
      if (stepStrips[idx]) {
        const img = stepStrips[idx].querySelector('img');
        const lbl = stepStrips[idx].querySelector('.gallery-label');
        const cap = stepStrips[idx].querySelector('.gallery-caption');
        if (img && st.image) img.src = fixImgPath(st.image, false);
        if (lbl && st.title) lbl.textContent = st.title;
        if (cap && st.caption) cap.textContent = st.caption;
      }
    });
  }

  // 5. Experience Sri Lanka & Video Showcase Section
  const defaultExp = {
    title: 'EXPERIENCE <span class="text-yellow">SRI LANKA</span><br>WITH TOTAL<br>INDEPENDENCE',
    description: 'Go from airport arrival to taking the wheel in record time — vehicle prepped, official permits confirmed, and the open road awaiting. From golden southern palm beaches to the mists of Kandy highlands, experience paradise on your own schedule.',
    videoMode: 'inline',
    card1: {
      image: './assets/images/about/kandy-experience-tour.webp',
      videoUrl: 'https://www.youtube.com/watch?v=5PyX0KZ8KR8'
    },
    card2: {
      image: './assets/images/about/607105091.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=l2rSbdjSpn4'
    },
    card3: {
      image: './assets/images/about/766476498.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=5PyX0KZ8KR8'
    }
  };

  const expData = homeData.experience || defaultExp;
  const dTitle = document.getElementById('discoverTitle');
  if (dTitle && expData.title) dTitle.innerHTML = sanitizeHTML(expData.title);
  const dDesc = document.getElementById('discoverDesc');
  if (dDesc && expData.description) dDesc.textContent = expData.description;

  const mode = expData.videoMode || 'inline';
  const cardDefs = [
    { cardEl: document.getElementById('discCard1'), data: expData.card1 || defaultExp.card1 },
    { cardEl: document.getElementById('discCard2'), data: expData.card2 || defaultExp.card2 },
    { cardEl: document.getElementById('discCard3'), data: expData.card3 || defaultExp.card3 }
  ];

  cardDefs.forEach(({ cardEl, data }) => {
    if (!cardEl || !data) return;
    const yId = extractYouTubeId(data.videoUrl);
    if (yId) {
      cardEl.setAttribute('data-video', yId);
      cardEl.setAttribute('role', 'button');
      cardEl.setAttribute('tabindex', '0');
      cardEl.setAttribute('aria-label', 'Play Sri Lanka Experience video');
    }

    const thumbUrl = data.image ? fixImgPath(data.image, false) : (yId ? `https://img.youtube.com/vi/${yId}/maxresdefault.jpg` : '');
    const fallbackThumb = yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : '';

    cardEl.innerHTML = `
      <img src="${escapeHTML(thumbUrl)}" onerror="if('${fallbackThumb}'){this.onerror=null;this.src='${fallbackThumb}';}" alt="Sri Lanka Experience Showcase" loading="lazy" decoding="async" width="600" height="340">
      <div class="disc-play">
        <div class="disc-play-btn" aria-hidden="true">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
    `;
  });
}

// LOAD ABOUT US PAGE DATA
async function loadAboutPageData() {
  if (!document.querySelector('.about-hero') && !document.querySelector('.about-intro')) return;
  const about = await getDoc('pages', 'about');
  if (!about) return;

  // Hero
  if (about.hero) {
    const heroTag = document.querySelector('.about-hero-tag');
    if (heroTag && about.hero.tag) heroTag.textContent = about.hero.tag;
    const heroTitle = document.querySelector('.about-hero-content h1');
    if (heroTitle && about.hero.title) heroTitle.innerHTML = sanitizeHTML(about.hero.title);
    const heroSub = document.querySelector('.about-hero-content p');
    if (heroSub && about.hero.subline) heroSub.textContent = about.hero.subline;
  }

  // Intro
  if (about.intro) {
    const secTag = document.querySelector('.about-intro-text .section-tag');
    if (secTag && about.intro.tag) secTag.textContent = about.intro.tag;
    const introTitle = document.querySelector('.about-intro-text h2');
    if (introTitle && about.intro.title) introTitle.innerHTML = sanitizeHTML(about.intro.title);

    const introPs = document.querySelectorAll('.about-intro-text > p');
    if (introPs.length >= 2) {
      if (about.intro.p1) introPs[0].textContent = about.intro.p1;
      if (about.intro.p2) introPs[1].textContent = about.intro.p2;
    }

    const badgeWrap = document.querySelector('.about-intro-img-badge');
    if (badgeWrap) {
      if (!about.intro.badgeNum || String(about.intro.badgeNum).trim() === '') {
        badgeWrap.style.display = 'none';
      } else {
        badgeWrap.style.display = '';
        const badgeNum = badgeWrap.querySelector('.badge-num');
        if (badgeNum) badgeNum.textContent = about.intro.badgeNum;
        const badgeLabel = badgeWrap.querySelector('.badge-label');
        if (badgeLabel && about.intro.badgeLabel) badgeLabel.textContent = about.intro.badgeLabel;
      }
    }

    const introImg = document.querySelector('.about-intro-img');
    if (introImg) {
      introImg.style.setProperty('width', '100%', 'important');
      introImg.style.setProperty('height', 'auto', 'important');
      introImg.style.setProperty('max-height', '450px', 'important');
      introImg.style.setProperty('object-fit', 'cover', 'important');
      introImg.style.setProperty('border-radius', '20px', 'important');
      introImg.style.setProperty('display', 'block', 'important');
      if (about.intro && about.intro.image) {
        introImg.src = fixImgPath(about.intro.image, false);
      }
    }

    if (Array.isArray(about.intro.checkItems) && about.intro.checkItems.length > 0) {
      const checksWrap = document.querySelector('.about-intro-checks');
      if (checksWrap) {
        checksWrap.innerHTML = about.intro.checkItems.map(item => `
          <div class="about-check-item">
            <span class="about-check-icon"><i class="fa-solid fa-check"></i></span>
            <span>${escapeHTML(item)}</span>
          </div>
        `).join('');
      }
    }
  }

  // Stats Counters
  if (Array.isArray(about.stats) && about.stats.length > 0) {
    const statsWrap = document.querySelector('.about-stats-inner');
    if (statsWrap) {
      statsWrap.innerHTML = about.stats.map(s => `
        <div class="stat-card">
          <div class="stat-num">${escapeHTML(s.number)}</div>
          <div class="stat-label">${escapeHTML(s.label)}</div>
        </div>
      `).join('');
    }
  }

  // Core Values
  if (Array.isArray(about.values) && about.values.length > 0) {
    const valuesWrap = document.querySelector('.about-values-grid');
    if (valuesWrap) {
      valuesWrap.innerHTML = about.values.map(v => `
        <div class="value-card reveal in visible">
          <div class="value-icon"><i class="${escapeHTML(v.icon || 'fa-solid fa-check')}"></i></div>
          <h3>${escapeHTML(v.title)}</h3>
          <p>${escapeHTML(v.desc)}</p>
        </div>
      `).join('');
    }
  }

  // CTA
  if (about.cta) {
    const ctaTitle = document.querySelector('.about-cta-title');
    if (ctaTitle && about.cta.title) ctaTitle.textContent = about.cta.title;
  }
}

// LOAD DESTINATIONS PAGE DATA
async function loadDestinationsPageData() {
  const destGrid = document.getElementById('destGrid');
  if (!destGrid) return;

  const pageDoc = await getDoc('pages', 'destinations');
  if (pageDoc && pageDoc.hero) {
    const heroTag = document.querySelector('.destinations-hero-tag');
    if (heroTag && pageDoc.hero.tag) heroTag.textContent = pageDoc.hero.tag;
    const heroTitle = document.querySelector('.destinations-hero-content h1');
    if (heroTitle && pageDoc.hero.title) heroTitle.innerHTML = sanitizeHTML(pageDoc.hero.title);
    const heroSub = document.querySelector('.destinations-hero-content p');
    if (heroSub && pageDoc.hero.subline) heroSub.textContent = pageDoc.hero.subline;
  }

  const destinations = await getCollection('destinations');
  if (destinations && destinations.length > 0) {
    window.allDestinationsData = destinations;
    const targetWa = normalizeWhatsAppNumber(window.siteSettings?.whatsapp || '94772013059');

    destGrid.innerHTML = destinations.map(d => {
      const imgPath = fixImgPath(d.image || './assets/images/destinations/dalada_maligawa.jpg', false);
      const category = d.category || 'culture';
      const badge = d.badge || '';
      const subtitle = d.subtitle || '';
      const waText = encodeURIComponent(`Hello Danan Rentals, I want to rent a vehicle to visit ${d.title}`);
      return `
        <div class="dest-card reveal in visible" data-category="${escapeHTML(category)}">
          <div class="dest-card-img-wrap">
            <img src="${escapeHTML(imgPath)}" alt="${escapeHTML(d.title)}" loading="lazy">
            ${badge ? `<span class="dest-tag-badge"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(badge)}</span>` : ''}
          </div>
          <div class="dest-card-body">
            ${subtitle ? `<div class="dest-card-sub">${escapeHTML(subtitle)}</div>` : ''}
            <h3 class="dest-card-title">${escapeHTML(d.title)}</h3>
            <p class="dest-card-desc">${escapeHTML(d.description)}</p>
            <div class="dest-card-footer">
              <a href="https://wa.me/${targetWa}?text=${waText}" target="_blank" rel="noopener noreferrer" class="dest-btn-wa">
                <i class="fa-brands fa-whatsapp"></i> Rent Vehicle to Visit
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  initDestinationFilters();
}

function initDestinationFilters() {
  const buttons = document.querySelectorAll('.dest-filter-btn');
  const cards = document.querySelectorAll('.destinations-grid .dest-card');
  if (buttons.length === 0 || cards.length === 0) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const cat = card.getAttribute('data-category') || '';
        if (filter === 'all' || cat.includes(filter)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// LOAD BOOKINGS PAGE DATA
async function loadBookingsPageData() {
  if (!document.querySelector('.bookings-hero') && !document.querySelector('.bookings-main')) return;

  const bookingsData = await getDoc('pages', 'bookings');
  if (!bookingsData) return;

  if (bookingsData.hero) {
    const heroTag = document.querySelector('.bookings-hero-tag');
    if (heroTag && bookingsData.hero.tag) heroTag.textContent = bookingsData.hero.tag;
    const heroTitle = document.querySelector('.bookings-hero-content h1');
    if (heroTitle && bookingsData.hero.title) heroTitle.innerHTML = sanitizeHTML(bookingsData.hero.title);
    const heroSub = document.querySelector('.bookings-hero-content p');
    if (heroSub && bookingsData.hero.subline) heroSub.textContent = bookingsData.hero.subline;
  }

  // Populate vehicle dropdown in bookings form
  const vSelect = document.getElementById('booking-vehicle-select');
  if (vSelect) {
    const vehicles = await getCollection('vehicles');
    const available = SHOW_UNAVAILABLE_AS_BOOKED ? vehicles : vehicles.filter(v => v.available !== false);
    if (available.length > 0) {
      vSelect.innerHTML = available.map(v => `
        <option value="${escapeHTML(v.name)}">${escapeHTML(v.name)} (${escapeHTML(v.type || 'Vehicle')}) - Rs. ${(v.price24h || 0).toLocaleString()}/day</option>
      `).join('');
    }
  }

  // 4 Rental Policies
  if (Array.isArray(bookingsData.policies) && bookingsData.policies.length > 0) {
    const polCards = document.querySelectorAll('.booking-policy-card');
    bookingsData.policies.forEach((pol, idx) => {
      if (polCards[idx]) {
        const h4 = polCards[idx].querySelector('h4');
        const p = polCards[idx].querySelector('p');
        if (h4 && pol.title) h4.textContent = pol.title;
        if (p && pol.desc) p.textContent = pol.desc;
      }
    });
  }

  // CTA
  if (bookingsData.cta) {
    const ctaH2 = document.querySelector('.bookings-cta-content h2');
    if (ctaH2 && bookingsData.cta.title) ctaH2.textContent = bookingsData.cta.title;
  }
}

// LOAD CONTACT PAGE DATA
async function loadContactPageData() {
  if (!document.querySelector('.contact-hero') && !document.querySelector('.contact-main')) return;

  const contactData = await getDoc('pages', 'contact');
  const settings = window.siteSettings || await getDoc('settings', 'site') || {};

  if (contactData && contactData.hero) {
    const heroTitle = document.querySelector('.contact-hero-content h1');
    if (heroTitle && contactData.hero.title) heroTitle.innerHTML = sanitizeHTML(contactData.hero.title);
    const heroSub = document.querySelector('.contact-hero-content p');
    if (heroSub && contactData.hero.subline) heroSub.textContent = contactData.hero.subline;
  }

  // Sync phones, whatsapp, email, address, hours from settings if updated
  const phones = settings.phones || (contactData && contactData.phones);
  if (phones && phones.length > 0) {
    const phoneWrap = document.querySelector('.contact-info-card:nth-child(1) p');
    if (phoneWrap) {
      phoneWrap.innerHTML = phones.map(p => `<a href="tel:${sanitizeTel(p)}">${escapeHTML(p)}</a>`).join('<br>');
    }
  }

  const email = settings.email || (contactData && contactData.email);
  if (email) {
    const emailLink = document.querySelector('.contact-info-card:nth-child(2) p a');
    if (emailLink) {
      emailLink.href = `mailto:${sanitizeMailto(email)}`;
      emailLink.textContent = email;
    }
  }

  const whatsapp = settings.whatsapp || (contactData && contactData.whatsapp);
  if (whatsapp) {
    const waLink = document.querySelector('.contact-info-card:nth-child(3) p a');
    if (waLink) {
      const targetWa = normalizeWhatsAppNumber(whatsapp);
      waLink.href = `https://wa.me/${targetWa}`;
      waLink.textContent = `+${targetWa}`;
    }
  }

  const address = settings.address || (contactData && contactData.address);
  if (address) {
    const addrP = document.querySelector('.contact-info-card:nth-child(4) p');
    if (addrP) addrP.textContent = address;
  }

  const hours = settings.hours || (contactData && contactData.hours);
  if (hours) {
    const hoursP = document.querySelector('.contact-info-card:nth-child(5) p');
    if (hoursP) hoursP.textContent = hours;
  }
}

// LOAD VEHICLES GRID
async function loadVehiclesGrid() {
  const grid = document.getElementById('featuredVehiclesGrid');
  if (!grid) return;

  // Show Skeleton Loaders first
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="rc card-skeleton">
      <div class="skeleton-img"></div>
      <div class="rc-body">
        <div class="skeleton-line" style="width:40%;height:12px;margin-bottom:10px;"></div>
        <div class="skeleton-line" style="width:75%;height:20px;margin-bottom:16px;"></div>
        <div class="skeleton-line" style="width:90%;height:12px;margin-bottom:8px;"></div>
        <div class="skeleton-line" style="width:60%;height:12px;"></div>
      </div>
    </div>
  `).join('');

  let vehicles = await getCollection('vehicles');
  
  // Verify if Firestore data is valid official fleet; if empty, missing prices, or legacy dummy items, use official data/vehicles.json
  const isLegacyInvalid = !Array.isArray(vehicles) || vehicles.length === 0 ||
    vehicles.some(v => (!v.price24h && !v.price) || (v.name && v.name.includes('Yamaha FZ')) || (v.images && v.images[0] && v.images[0].includes('fleet-banner.jpeg')));

  if (isLegacyInvalid) {
    try {
      const res = await fetch('./data/vehicles.json');
      if (res.ok) {
        vehicles = await res.json();
      }
    } catch (e) {
      console.warn('Fallback vehicles fetch error:', e);
    }
  }

  const displayVehicles = SHOW_UNAVAILABLE_AS_BOOKED ? vehicles : vehicles.filter(v => v.available !== false);
  window.allVehiclesData = displayVehicles;

  renderVehiclesList(displayVehicles);

  if (document.querySelector('.fleet-carousel-wrapper')) {
    setTimeout(initFleetCarousel, 100);
  }
}

let fleetCarouselTimer = null;
function initFleetCarousel() {
  const track = document.getElementById('featuredVehiclesGrid');
  const wrapper = document.querySelector('.fleet-carousel-wrapper');
  if (!track || !wrapper) return;

  const prevBtn = document.getElementById('fleetPrevBtn');
  const nextBtn = document.getElementById('fleetNextBtn');
  const dotsContainer = document.getElementById('fleetDots');

  const cards = track.querySelectorAll('.rc');
  if (cards.length === 0) return;

  let currentIndex = 0;

  function getVisibleCards() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 4;
  }

  function getMaxIndex() {
    const visible = getVisibleCards();
    return Math.max(0, cards.length - visible);
  }

  function updateSlider() {
    const maxIdx = getMaxIndex();
    if (currentIndex > maxIdx) currentIndex = 0;
    if (currentIndex < 0) currentIndex = maxIdx;

    const card = cards[0];
    if (!card) return;
    const cardWidth = card.offsetWidth;
    const gap = 24;
    const offset = (cardWidth + gap) * currentIndex;

    track.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(-${offset}px)`;

    if (dotsContainer) {
      dotsContainer.querySelectorAll('.fleet-dot').forEach((d, idx) => {
        d.classList.toggle('active', idx === currentIndex);
      });
    }
  }

  function createDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const maxIdx = getMaxIndex();

    for (let i = 0; i <= maxIdx; i++) {
      const dot = document.createElement('div');
      dot.className = `fleet-dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateSlider();
        resetTimer();
      });
      dotsContainer.appendChild(dot);
    }
  }

  function nextSlide() {
    const maxIdx = getMaxIndex();
    currentIndex = currentIndex >= maxIdx ? 0 : currentIndex + 1;
    updateSlider();
  }

  function prevSlide() {
    const maxIdx = getMaxIndex();
    currentIndex = currentIndex <= 0 ? maxIdx : currentIndex - 1;
    updateSlider();
  }

  function startTimer() {
    stopTimer();
    fleetCarouselTimer = setInterval(nextSlide, 4500);
  }

  function stopTimer() {
    if (fleetCarouselTimer) clearInterval(fleetCarouselTimer);
  }

  function resetTimer() {
    stopTimer();
    startTimer();
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetTimer(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetTimer(); });

  wrapper.addEventListener('mouseenter', stopTimer);
  wrapper.addEventListener('mouseleave', startTimer);

  // Touch swipe support for mobile touchscreens
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  wrapper.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
      stopTimer();
    }
  }, { passive: true });

  wrapper.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    if (e.changedTouches && e.changedTouches.length === 1) {
      const diffX = touchStartX - e.changedTouches[0].clientX;
      const diffY = touchStartY - e.changedTouches[0].clientY;
      // Trigger slide only if horizontal swipe dominates over vertical scrolling
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }
    startTimer();
  }, { passive: true });

  window.addEventListener('resize', () => {
    createDots();
    updateSlider();
  });

  // Pause fleet carousel when tab is backgrounded to save mobile battery (B2)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTimer();
    else startTimer();
  });

  createDots();
  updateSlider();
  startTimer();
}

function renderVehiclesList(vehicles, activeCat = 'all') {
  const grid = document.getElementById('featuredVehiclesGrid');
  if (!grid) return;

  const fleetCountText = document.getElementById('fleetCountText');
  if (fleetCountText) {
    const catMap = {
      all: 'Vehicles',
      scooter: 'Scooters',
      cars: 'Cars',
      vans: 'Vans',
      bikes: 'Motor Bikes',
      tuktuk: 'Tuk Tuks',
      cycle: 'Bicycles'
    };
    const cName = catMap[activeCat] || 'Vehicles';
    if (vehicles.length > 0) {
      fleetCountText.textContent = `${vehicles.length} ${cName} Available`;
    } else {
      fleetCountText.textContent = `Inquire for ${cName}`;
    }
  }

  if (vehicles.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.18);">
        <i class="fa-solid fa-headset" style="font-size: 2.4rem; margin-bottom: 12px; color: var(--yellow);"></i>
        <h3 style="font-size: 1.25rem; color: #FFF; margin-bottom: 8px;">Direct Rental Inquiries Available</h3>
        <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 520px; margin: 0 auto 18px;">Looking to book this category in Kandy or Peradeniya? Contact our team directly on WhatsApp for immediate confirmation & special rates.</p>
        <a href="https://wa.me/94772013059?text=Hello%20Danan%20Rentals,%20I%20want%20to%20inquire%20about%20vehicle%20rentals" target="_blank" rel="noopener noreferrer" class="btn-search" style="display: inline-flex; text-decoration: none; padding: 12px 28px;">
          <i class="fa-brands fa-whatsapp" style="font-size: 1.2rem;"></i> Inquire on WhatsApp
        </a>
      </div>
    `;
    return;
  }

  grid.innerHTML = vehicles.map(v => {
    const brandName = (v.type === 'Bikes') ? 'Danan Two-Wheelers' : 'Danan Rental Fleet';

    // Resolve PickMe vector outline next-gen WebP images
    let imgUrl = (v.images && v.images.length > 0) ? v.images[0] : '';
    if (!imgUrl || imgUrl.includes('fleet-banner.jpeg') || imgUrl.includes('vehicle-')) {
      const lower = (v.name || '').toLowerCase();
      if (lower.includes('dio')) imgUrl = './assets/images/vehicles/vector-dio.webp';
      else if (lower.includes('ntorq')) imgUrl = './assets/images/vehicles/vector-ntorq.webp';
      else if (lower.includes('indian') || lower.includes('2014')) imgUrl = './assets/images/vehicles/vector-alto-indian.webp';
      else if (lower.includes('japan') || lower.includes('alto')) imgUrl = './assets/images/vehicles/vector-alto-japan.webp';
      else if (lower.includes('every') || lower.includes('van')) imgUrl = './assets/images/vehicles/vector-every-van.webp';
      else if (lower.includes('wagon')) imgUrl = './assets/images/vehicles/vector-wagon-r.webp';
      else imgUrl = './assets/images/vehicles/vector-wagon-r.webp';
    } else if (imgUrl.endsWith('.png') || imgUrl.endsWith('.jpg') || imgUrl.endsWith('.jpeg')) {
      // Prefer WebP if path matches known assets
      const webpCandidate = imgUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      imgUrl = webpCandidate;
    }

    // Determine category attribute
    let cardCat = 'cars';
    const lowerName = (v.name || '').toLowerCase();
    const lowerType = (v.type || '').toLowerCase();
    if (lowerName.includes('dio') || lowerName.includes('ntorq') || lowerType.includes('scooter') || lowerType.includes('bike')) {
      cardCat = 'scooter';
    } else if (lowerName.includes('every') || lowerName.includes('van')) {
      cardCat = 'vans';
    } else if (lowerName.includes('cycle')) {
      cardCat = 'cycle';
    } else if (lowerName.includes('tuk')) {
      cardCat = 'tuktuk';
    }

    // Resolve accurate daily price (never Rs. 0)
    let priceVal = v.price24h || v.price || 0;
    if (priceVal <= 0) {
      const lower = (v.name || '').toLowerCase();
      if (lower.includes('dio')) priceVal = 3000;
      else if (lower.includes('ntorq')) priceVal = 3500;
      else if (lower.includes('indian alto') || lower.includes('2014')) priceVal = 6000;
      else if (lower.includes('japan alto') || (lower.includes('alto') && lower.includes('auto'))) priceVal = 6000;
      else if (lower.includes('every') || lower.includes('van')) priceVal = 8000;
      else if (lower.includes('wagon')) priceVal = 8500;
      else priceVal = 6000;
    }

    return `
      <div data-book="${escapeHTML(v.id)}" data-category="${cardCat}" class="rc reveal visible in" style="cursor: pointer;">
        <div class="rc-img">
          <img src="${escapeHTML(fixImgPath(imgUrl, false))}" alt="${escapeHTML(v.name)}" loading="lazy" decoding="async" width="480" height="300">
          <div class="rc-badge ${(v.available !== false && v.available !== 'false') ? '' : 'rc-badge-unavailable'}">${(v.available !== false && v.available !== 'false') ? 'AVAILABLE' : 'UNAVAILABLE'}</div>
          <button class="rc-wishlist" onclick="event.stopPropagation();" aria-label="Add to wishlist">
            <i class="fa-regular fa-heart"></i>
          </button>
        </div>
        <div class="rc-body">
          <div class="rc-type">${escapeHTML(brandName)}</div>
          <div class="rc-name">${escapeHTML(v.name)}</div>
          <div class="rc-tags">
            <span class="rc-tag"><i class="fa-solid fa-shield"></i> Insurance</span>
            <span class="rc-tag"><i class="fa-solid fa-gauge-high"></i> ${v.kmIncluded || 200}km / Day</span>
            ${v.deposit ? `<span class="rc-tag"><i class="fa-solid fa-hand-holding-dollar"></i> Deposit Rs. ${v.deposit.toLocaleString()}</span>` : ''}
            ${v.extraKmRate ? `<span class="rc-tag"><i class="fa-solid fa-road"></i> Extra Km: Rs. ${v.extraKmRate}</span>` : ''}
            ${v.extraHourRate ? `<span class="rc-tag"><i class="fa-solid fa-clock"></i> Extra Hr: Rs. ${v.extraHourRate}</span>` : ''}
            <span class="rc-tag"><i class="fa-solid fa-gas-pump"></i> ${escapeHTML(v.fuel || 'Petrol')}</span>
          </div>
          <hr class="rc-divider">
          <div class="rc-footer">
            <div class="rc-price">Rs. ${priceVal.toLocaleString()} <sub>/day</sub></div>
            <button class="rc-btn" data-book="${escapeHTML(v.id)}">BOOK NOW</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.initScrollReveal) {
    window.initScrollReveal();
  }
  grid.querySelectorAll('.reveal').forEach(el => el.classList.add('visible', 'in'));
}

// INITIALIZE CURRENT YEAR
function initCurrentYear() {
  const currentYear = new Date().getFullYear();
  document.querySelectorAll('.current-year').forEach(el => {
    el.textContent = currentYear;
  });
}

// LOAD RULES & FAQS
async function loadRulesAndFaqs() {
  const rulesContainer = document.getElementById('rulesContainer');
  if (rulesContainer) {
    const rules = await getCollection('rules');
    if (rules.length === 0) {
      rulesContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.95rem;">No specific rental rules listed at this time.</p>`;
    } else {
      rulesContainer.innerHTML = rules.map(r => `
        <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-left: 4px solid var(--yellow); border-radius: var(--radius-sm); padding: 18px; margin-bottom: 14px;">
          <h4 style="font-size: 1.05rem; color: var(--white); margin-bottom: 6px;">${escapeHTML(r.title)}</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted);">${escapeHTML(r.body)}</p>
        </div>
      `).join('');
    }
  }

  const faqsContainer = document.getElementById('faqsContainer');
  if (faqsContainer) {
    const faqs = await getCollection('faqs');
    if (faqs.length === 0) {
      faqsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.95rem;">No frequently asked questions listed at this time.</p>`;
    } else {
      faqsContainer.innerHTML = faqs.map(f => `
        <details class="faq-accordion-item">
          <summary class="faq-accordion-header">
            <span>${escapeHTML(f.question)}</span>
            <i class="fa-solid fa-chevron-down faq-accordion-icon"></i>
          </summary>
          <div class="faq-accordion-body">
            <p>${escapeHTML(f.answer)}</p>
          </div>
        </details>
      `).join('');
    }
  }
}

// LOAD REVIEWS CAROUSEL
async function loadReviewsTrack() {
  const reviewsSection = document.getElementById('reviews');
  const track = document.getElementById('testiTrack');
  if (!track) return;

  const reviews = await getCollection('reviews');
  const visible = (reviews || []).filter(r => r.visible !== false);

  if (visible.length === 0) {
    if (reviewsSection) reviewsSection.style.display = 'none';
    return;
  }

  if (reviewsSection) reviewsSection.style.display = '';
  if (track) {
    track.innerHTML = visible.map(r => `
      <div class="testi-card">
        <div class="testi-head">
          <div class="testi-av">
            <img src="${escapeHTML(fixImgPath(r.photo || './assets/images/customers/customer-1.jpeg', false))}" alt="${escapeHTML(r.name)}" width="50" height="50" loading="lazy">
          </div>
          <div>
            <div class="testi-name">${escapeHTML(r.name)}</div>
            <div style="font-size: 0.78rem; color: var(--yellow); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
              <i class="fa-brands fa-google" style="color:#4285F4;"></i> ${escapeHTML(r.source || 'Google Review')}
            </div>
          </div>
        </div>
        <div class="testi-stars">
          ${Array(Math.min(r.rating || 5, 5)).fill('<i class="fa-solid fa-star" style="color:#FFB800;"></i>').join('')}
        </div>
        <p class="testi-text">"${escapeHTML(r.text)}"</p>
      </div>
    `).join('');
  }
}

// TESTIMONIALS CAROUSEL PREV / NEXT BUTTONS
function initTestimonialsCarousel() {
  const track = document.getElementById('testiTrack');
  const prevBtn = document.getElementById('testiPrev');
  const nextBtn = document.getElementById('testiNext');

  if (!track || !prevBtn || !nextBtn) return;

  function getScrollStep() {
    const card = track.querySelector('.testi-card');
    if (!card) return 300;
    return card.offsetWidth + 24;
  }

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
  });
}

// WHY CHOOSE US AUTO-SWAP CAROUSEL
function initWhyCarousel() {
  const track = document.getElementById('whyTrack');
  const prevBtn = document.getElementById('whyPrevBtn');
  const nextBtn = document.getElementById('whyNextBtn');
  const dotsContainer = document.getElementById('whyDots');

  if (!track) return;

  // Clear any existing active timer to avoid zombie intervals
  if (window._whyAutoSlideTimer) {
    clearInterval(window._whyAutoSlideTimer);
    window._whyAutoSlideTimer = null;
  }

  let currentIndex = 0;

  function getItems() {
    return track.querySelectorAll('.why-item');
  }

  function getVisibleItemsCount() {
    const width = window.innerWidth;
    if (width <= 640) return 1;
    if (width <= 900) return 2;
    if (width <= 1200) return 3;
    return 4;
  }

  function getMaxIndex() {
    const items = getItems();
    const visibleCount = getVisibleItemsCount();
    return Math.max(0, items.length - visibleCount);
  }

  function updateSlider() {
    const items = getItems();
    if (items.length === 0) return;

    const maxIdx = getMaxIndex();
    if (currentIndex > maxIdx) currentIndex = 0;
    if (currentIndex < 0) currentIndex = maxIdx;

    const firstItem = items[0];
    const itemWidth = firstItem.offsetWidth || 280;
    const computedGap = parseFloat(window.getComputedStyle(track).gap) || 20;
    const moveAmount = (itemWidth + computedGap) * currentIndex;
    track.style.transform = `translateX(-${moveAmount}px)`;

    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.why-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }
  }

  function createDots() {
    if (!dotsContainer) return;
    const maxIdx = getMaxIndex();
    dotsContainer.innerHTML = '';

    for (let i = 0; i <= maxIdx; i++) {
      const dot = document.createElement('div');
      dot.className = `why-dot ${i === currentIndex ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.onclick = () => {
        currentIndex = i;
        updateSlider();
        resetAutoSlide();
      };
      dotsContainer.appendChild(dot);
    }
  }

  function nextSlide() {
    const maxIdx = getMaxIndex();
    if (maxIdx <= 0) return;
    currentIndex = currentIndex >= maxIdx ? 0 : currentIndex + 1;
    updateSlider();
  }

  function prevSlide() {
    const maxIdx = getMaxIndex();
    if (maxIdx <= 0) return;
    currentIndex = currentIndex <= 0 ? maxIdx : currentIndex - 1;
    updateSlider();
  }

  function startAutoSlide() {
    stopAutoSlide();
    window._whyAutoSlideTimer = setInterval(nextSlide, 3200);
  }

  function stopAutoSlide() {
    if (window._whyAutoSlideTimer) {
      clearInterval(window._whyAutoSlideTimer);
      window._whyAutoSlideTimer = null;
    }
  }

  function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      nextSlide();
      resetAutoSlide();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      prevSlide();
      resetAutoSlide();
    };
  }

  // Touch swipe support for Why-Us carousel on Android and mobile
  let touchStartX = 0;
  let touchEndX = 0;

  track.ontouchstart = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      touchStartX = e.changedTouches[0].screenX;
    }
    stopAutoSlide();
  };

  track.ontouchend = (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 35) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
    }
    resetAutoSlide();
  };

  const viewport = track.parentElement;
  if (viewport) {
    viewport.onmouseenter = stopAutoSlide;
    viewport.onmouseleave = startAutoSlide;
  }

  // Handle visibility change to save mobile battery
  if (!window._whyVisibilityAttached) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoSlide();
      else startAutoSlide();
    });
    window._whyVisibilityAttached = true;
  }

  // Handle window resize
  if (!window._whyResizeAttached) {
    window.addEventListener('resize', () => {
      createDots();
      updateSlider();
    });
    window._whyResizeAttached = true;
  }

  createDots();
  updateSlider();
  startAutoSlide();
}

// Tap-to-interact helper for mobile Google Map iframes (A4 & B3)
function initTapToInteractMaps() {
  const mapWrappers = document.querySelectorAll('.footer-map-wrap, .contact-map');
  if (mapWrappers.length === 0) return;

  mapWrappers.forEach(wrap => {
    wrap.addEventListener('click', (e) => {
      mapWrappers.forEach(w => { if (w !== wrap) w.classList.remove('map-interactive'); });
      wrap.classList.add('map-interactive');
      e.stopPropagation();
    });
  });

  document.addEventListener('click', (e) => {
    mapWrappers.forEach(wrap => {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('map-interactive');
      }
    });
  });

  window.addEventListener('scroll', () => {
    mapWrappers.forEach(wrap => wrap.classList.remove('map-interactive'));
  }, { passive: true });
}

// AUTO-SWAP CUSTOMER GALLERY
async function initCustomerGallerySwap() {
  const imgMain = document.getElementById('aboutImgMain');
  const imgOverlay = document.getElementById('aboutImgOverlay');
  const captionText = document.getElementById('galleryCaptionText');
  if (!imgMain || !imgOverlay) return;

  const galleryItems = await getCollection('gallery');
  if (!galleryItems || galleryItems.length === 0) return;

  const items = galleryItems.map(item => ({
    ...item,
    image: fixImgPath(item.image, false)
  }));

  if (items.length === 0) return;

  let currentIndex = 0;
  let galleryTimer = null;

  // Helper: auto-adjust object-position based on image aspect ratio
  function applySmartImageFit(img) {
    if (!img) return;
    const adjust = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const aspect = img.naturalWidth / img.naturalHeight;
      // Portrait / vertical mobile photo (< 0.9 aspect): focus on upper 15% to preserve heads & smiles
      if (aspect < 0.9) {
        img.style.objectPosition = 'center 15%';
      } else if (aspect < 1.15) {
        // Square photo: center 20%
        img.style.objectPosition = 'center 20%';
      } else {
        // Landscape photo: center 25%
        img.style.objectPosition = 'center 25%';
      }
    };
    if (img.complete && img.naturalWidth) adjust();
    else img.addEventListener('load', adjust, { once: true });
  }

  function updateGalleryDisplay() {
    const itemMain = items[currentIndex % items.length];
    const itemOverlay = items[(currentIndex + 1) % items.length];

    imgMain.classList.add('about-img-fade');
    imgOverlay.classList.add('about-img-fade');

    setTimeout(() => {
      if (itemMain && itemMain.image) {
        imgMain.src = itemMain.image;
        applySmartImageFit(imgMain);
        if (captionText) captionText.textContent = itemMain.caption || "Verified Customer Photo";
      }
      if (itemOverlay && itemOverlay.image) {
        imgOverlay.src = itemOverlay.image;
        applySmartImageFit(imgOverlay);
      }

      imgMain.classList.remove('about-img-fade');
      imgOverlay.classList.remove('about-img-fade');
    }, 450);
  }

  // Initial fit adjustment
  applySmartImageFit(imgMain);
  applySmartImageFit(imgOverlay);

  function startGalleryTimer() {
    if (items.length > 1 && !galleryTimer) {
      galleryTimer = setInterval(() => {
        currentIndex = (currentIndex + 1) % items.length;
        updateGalleryDisplay();
      }, 5000);
    }
  }

  function stopGalleryTimer() {
    if (galleryTimer) {
      clearInterval(galleryTimer);
      galleryTimer = null;
    }
  }

  updateGalleryDisplay();
  startGalleryTimer();

  // Pause gallery swap when tab is backgrounded
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopGalleryTimer();
    else startGalleryTimer();
  });
}

// ENSURE SHARED BOOKING MODAL COMPONENT IN DOM
function ensureBookingModalDOM() {
  if (document.getElementById('bookingModalOverlay')) return;

  const modalHTML = `
  <div class="booking-modal-overlay" id="bookingModalOverlay" role="dialog" aria-modal="true" aria-labelledby="bmTitle" style="display:none;">
    <div class="booking-modal-card">
      <div class="booking-modal-header">
        <div class="booking-modal-title" id="bmTitle">
          <i class="fa-solid fa-calendar-check" style="color:var(--yellow);"></i> Rental Booking Inquiry
        </div>
        <button type="button" class="booking-modal-close" id="btnBmClose" aria-label="Close booking modal">&times;</button>
      </div>
      <div class="booking-modal-body">
        
        <!-- Selected Vehicle Preview Header -->
        <div class="bm-selected-vehicle">
          <img id="bmVehImg" src="./assets/images/vehicles/fleet-banner.jpeg" alt="Selected rental vehicle" class="bm-vehicle-img" width="120" height="80" loading="lazy">
          <div class="bm-vehicle-info">
            <div id="bmVehName" class="bm-vehicle-name">Select Vehicle</div>
            <div id="bmVehRate" class="bm-vehicle-rate">Rs. 3,000 / day • 200 Free Km/Day</div>
          </div>
        </div>

        <form id="bookingInquiryForm" novalidate>
          <div class="bm-grid">
            <div class="bm-form-group">
              <label for="bmFullName" class="bm-label">Your Full Name <span style="color:var(--yellow);">*</span></label>
              <input type="text" id="bmFullName" class="bm-input" placeholder="e.g. John Smith" required>
              <span class="bm-error-msg" id="bmFullNameError" style="color:#ef4444; font-size:0.75rem; display:none; margin-top:4px;">Please enter your name</span>
            </div>
            <div class="bm-form-group">
              <label for="bmPhone" class="bm-label">WhatsApp / Phone Number <span style="color:var(--yellow);">*</span></label>
              <input type="tel" id="bmPhone" class="bm-input" placeholder="+94 77 123 4567" required>
              <span class="bm-error-msg" id="bmPhoneError" style="color:#ef4444; font-size:0.75rem; display:none; margin-top:4px;">Please enter a valid phone number</span>
            </div>
          </div>

          <div class="bm-grid">
            <div class="bm-form-group">
              <label for="bmPickupDate" class="bm-label">Pickup Date &amp; Time <span style="color:var(--yellow);">*</span></label>
              <input type="datetime-local" id="bmPickupDate" class="bm-input" required>
              <span class="bm-error-msg" id="bmPickupDateError" style="color:#ef4444; font-size:0.75rem; display:none; margin-top:4px;">Please select an upcoming pickup date</span>
            </div>
            <div class="bm-form-group">
              <label for="bmReturnDate" class="bm-label">Return Date &amp; Time <span style="color:var(--yellow);">*</span></label>
              <input type="datetime-local" id="bmReturnDate" class="bm-input" required>
              <span class="bm-error-msg" id="bmReturnDateError" style="color:#ef4444; font-size:0.75rem; display:none; margin-top:4px;">Return date must be after pickup date</span>
            </div>
          </div>

          <div class="bm-grid">
            <div class="bm-form-group">
              <label for="bmPickupLoc" class="bm-label">Pickup / Delivery Location</label>
              <select id="bmPickupLoc" class="bm-select">
                <option value="Kandy City / Hotel Delivery">Kandy City / Hotel Delivery</option>
                <option value="Peradeniya Railway Station">Peradeniya Railway Station</option>
                <option value="Kandy Railway Station">Kandy Railway Station</option>
                <option value="Colombo BIA Airport Transfer">Colombo Airport (BIA) Transfer</option>
                <option value="Other Location in Sri Lanka">Other (Specify in Notes)</option>
              </select>
            </div>
            <div class="bm-form-group">
              <label for="bmPermitStatus" class="bm-label">Driving License Permit Status</label>
              <select id="bmPermitStatus" class="bm-select">
                <option value="I have International / Local License">I have International / Local License</option>
                <option value="Need AA Ceylon Permit Assistance">Need AA Ceylon Permit Assistance</option>
              </select>
            </div>
          </div>

          <div class="bm-form-group full-width" style="margin-bottom: 16px;">
            <label for="bmNotes" class="bm-label">Special Requests / Notes (Optional)</label>
            <textarea id="bmNotes" class="bm-textarea" rows="2" placeholder="e.g. Need extra helmet, child seat, delivery address..."></textarea>
          </div>

          <!-- Price Estimate Display -->
          <div class="bm-price-est-box">
            <div class="bm-price-est-label">Estimated Rental Duration &amp; Total:</div>
            <div class="bm-price-est-value" id="bmEstTotal">Rs. 3,000 <span style="font-size: 0.8rem; font-weight: 500; color: rgba(255,255,255,0.7);">(1 Day)</span></div>
          </div>

          <!-- Unified Single Primary Action -->
          <div class="bm-actions" style="margin-top: 20px;">
            <button type="submit" id="btnBmSubmit" class="btn-bm-whatsapp" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 24px; font-size: 1.05rem; font-weight: 800; border-radius: 12px; background: #25D366; color: #FFFFFF; border: none; cursor: pointer; transition: all 0.25s ease;">
              <i class="fa-brands fa-whatsapp fa-xl"></i> Confirm &amp; Book via WhatsApp
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// BOOKING INQUIRY MODAL LOGIC
function initBookingInquiryModal() {
  ensureBookingModalDOM();
  const overlay = document.getElementById('bookingModalOverlay');
  const btnClose = document.getElementById('btnBmClose');
  const form = document.getElementById('bookingInquiryForm');

  if (!overlay || !form) return;

  const vehImg = document.getElementById('bmVehImg');
  const vehName = document.getElementById('bmVehName');
  const vehRate = document.getElementById('bmVehRate');
  const inputPickupDate = document.getElementById('bmPickupDate');
  const inputReturnDate = document.getElementById('bmReturnDate');
  const estTotalEl = document.getElementById('bmEstTotal');

  let activeVehPrice = 3000;
  let activeVehName = "Honda Dio 110cc";
  let previousActiveElement = null;

  function formatDateForInput(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const now = new Date();
  now.setMinutes(0);
  now.setSeconds(0);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  if (inputPickupDate && !inputPickupDate.value) {
    inputPickupDate.value = formatDateForInput(now);
  }
  if (inputReturnDate && !inputReturnDate.value) {
    inputReturnDate.value = formatDateForInput(tomorrow);
  }

  function calcEstPrice() {
    if (!inputPickupDate?.value || !inputReturnDate?.value) return;
    const start = new Date(inputPickupDate.value);
    const end = new Date(inputReturnDate.value);
    const diffTime = Math.max(end - start, 0);
    const diffHours = diffTime / (1000 * 60 * 60);
    let days = Math.max(Math.ceil(diffHours / 24), 1);

    const total = days * activeVehPrice;
    if (estTotalEl) {
      estTotalEl.innerHTML = `Rs. ${total.toLocaleString()} <span style="font-size: 0.8rem; font-weight: 500; color: rgba(255,255,255,0.7);">(${days} ${days === 1 ? 'Day' : 'Days'})</span>`;
    }
  }

  inputPickupDate?.addEventListener('change', calcEstPrice);
  inputReturnDate?.addEventListener('change', calcEstPrice);

  // Delegated click listener for data-book triggers
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-book]');
    if (!btn) return;
    if (e.target.closest('.rc-wishlist')) return;

    e.preventDefault();
    const vehId = btn.getAttribute('data-book');
    const veh = (window.allVehiclesData || []).find(v => String(v.id) === String(vehId));
    if (veh) {
      window.openBookingModal(veh);
    } else {
      window.openBookingModal({ name: 'Danan Rental Vehicle', price24h: 3000 });
    }
  });

  // Modal keydown handler for ESC and Focus Trap
  function handleModalKeyDown(e) {
    if (e.key === 'Escape') {
      window.closeBookingModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  window.openBookingModal = function(veh) {
    previousActiveElement = document.activeElement;
    if (veh) {
      activeVehPrice = veh.price24h || 3000;
      activeVehName = veh.name || "Vehicle";
      const rawImg = (veh.images && veh.images.length > 0) ? veh.images[0] : (veh.image || './assets/images/vehicles/fleet-banner.jpeg');
      if (vehImg) {
        vehImg.src = fixImgPath(rawImg, false);
        vehImg.alt = `${veh.name} booking preview`;
      }
      if (vehName) vehName.textContent = veh.name;
      if (vehRate) vehRate.textContent = `Rs. ${activeVehPrice.toLocaleString()} / day • ${veh.kmIncluded || 200} Free Km/Day`;
    }
    calcEstPrice();
    overlay.style.display = 'flex';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleModalKeyDown);
    setTimeout(() => {
      document.getElementById('bmFullName')?.focus();
    }, 100);
  };

  window.closeBookingModal = function() {
    overlay.classList.remove('active');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleModalKeyDown);
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
  };

  btnClose?.addEventListener('click', window.closeBookingModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.closeBookingModal();
  });

  // Backward compatibility helper
  window.openBookingModalByJson = function(vJsonStr) {
    try {
      let rawStr = vJsonStr;
      if (typeof rawStr === 'string' && rawStr.includes('&quot;')) {
        rawStr = rawStr.replace(/&quot;/g, '"');
      }
      const veh = typeof rawStr === 'string' ? JSON.parse(rawStr) : rawStr;
      window.openBookingModal(veh);
    } catch (e) {
      window.openBookingModal();
    }
  };

  // Ensure focused fields remain visible above Android on-screen keyboard
  form.querySelectorAll('.bm-input, .bm-select, .bm-textarea').forEach(field => {
    field.addEventListener('focus', () => {
      setTimeout(() => {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 280);
    });
  });

  // Form submit handler - Unified primary action
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullNameInput = document.getElementById('bmFullName');
    const phoneInput = document.getElementById('bmPhone');
    const fullName = fullNameInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
    const pickupDate = inputPickupDate?.value || '';
    const returnDate = inputReturnDate?.value || '';
    const location = document.getElementById('bmPickupLoc')?.value || 'Kandy';
    const permit = document.getElementById('bmPermitStatus')?.value || 'Standard';
    const notes = document.getElementById('bmNotes')?.value.trim() || 'None';

    // Validation
    let hasError = false;
    const hideErr = id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
    const showErr = id => { const el = document.getElementById(id); if (el) el.style.display = 'block'; hasError = true; };

    hideErr('bmFullNameError');
    hideErr('bmPhoneError');
    hideErr('bmPickupDateError');
    hideErr('bmReturnDateError');

    if (!fullName) showErr('bmFullNameError');
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 7) showErr('bmPhoneError');

    if (!pickupDate) {
      showErr('bmPickupDateError');
    }
    if (!returnDate) {
      showErr('bmReturnDateError');
    }

    if (hasError) return;

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const nowThreshold = new Date(Date.now() - 60 * 60 * 1000);

    if (start < nowThreshold) {
      showErr('bmPickupDateError');
      return;
    }
    if (end <= start) {
      showErr('bmReturnDateError');
      return;
    }

    const diffHours = Math.max((end - start) / (1000 * 60 * 60), 24);
    const days = Math.max(Math.ceil(diffHours / 24), 1);
    const estTotal = days * activeVehPrice;

    const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
    const payload = {
      id: bookingId,
      vehicleName: activeVehName,
      customerName: fullName,
      phone: phone,
      whatsapp: phone,
      pickupDate: pickupDate,
      returnDate: returnDate,
      dropoffDate: returnDate,
      durationDays: days,
      estimatedTotal: estTotal,
      location: location,
      pickupLocation: location,
      permitStatus: permit,
      notes: notes,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    // Format WhatsApp Message
    const targetWa = normalizeWhatsAppNumber(window.siteSettings?.whatsapp || '94772013059');
    const msg = `Hello Danan Rentals! 👋\n\nI would like to book a vehicle:\n\n🚗 *Vehicle:* ${activeVehName}\n👤 *Name:* ${fullName}\n📞 *Phone:* ${phone}\n📍 *Location:* ${location}\n📅 *Pickup:* ${pickupDate.replace('T', ' ')}\n📅 *Return:* ${returnDate.replace('T', ' ')} (${days} ${days === 1 ? 'Day' : 'Days'})\n💰 *Est. Total:* Rs. ${estTotal.toLocaleString()}\n📜 *Permit:* ${permit}\n💬 *Notes:* ${notes}\n\nPlease confirm availability & booking!`;
    const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(msg)}`;

    // Open WhatsApp synchronously on user action
    window.open(waUrl, '_blank');

    // Save to Firestore & local storage
    saveDoc('bookings', bookingId, payload).catch(err => {
      console.warn("Background save booking notice:", err);
    });
    try {
      const list = JSON.parse(localStorage.getItem('danan_bookings') || '[]');
      list.unshift(payload);
      localStorage.setItem('danan_bookings', JSON.stringify(list));
    } catch (e) {}

    window.closeBookingModal();
  });
}

// YOUTUBE VIDEO HELPER
function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=[&]?(?:amp;)?|&v=)([^#&?]*).*/;
  const match = String(url).match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// VIDEO LIGHTBOX MODAL CONTROLLER
function initVideoLightboxModal() {
  const overlay = document.getElementById('videoModalOverlay');
  const iframe = document.getElementById('videoModalIframe');
  const closeBtn = document.getElementById('btnVideoModalClose');

  window.openVideoModal = function(videoId) {
    if (!overlay || !iframe) return;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeVideoModal = function() {
    if (!overlay || !iframe) return;
    iframe.src = '';
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', window.closeVideoModal);
  }
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) window.closeVideoModal();
    });
  }

  // Handle ESC key close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
      window.closeVideoModal();
    }
  });

  // Handle click on any discover cards with video
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.disc-img');
    if (card) {
      const vid = card.getAttribute('data-video');
      if (vid && typeof window.openVideoModal === 'function') {
        window.openVideoModal(vid);
      }
    }
  });

  // Handle keyboard activation (Enter / Space) on discover cards
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.disc-img');
      if (card) {
        e.preventDefault();
        const vid = card.getAttribute('data-video');
        if (vid && typeof window.openVideoModal === 'function') {
          window.openVideoModal(vid);
        }
      }
    }
  });
}

