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

// Feature Flag: Set to true if unavailable vehicles should remain visible with a "BOOKED" badge
export const SHOW_UNAVAILABLE_AS_BOOKED = false;

async function initApp() {
  initHeroTabSwitcher();
  initTestimonialsCarousel();
  initWhyCarousel();
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
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
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

// HERO TAB SWITCHER
function initHeroTabSwitcher() {
  const tabs = document.querySelectorAll('.hero-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filterType = tab.getAttribute('data-tab');
      if (window.allVehiclesData) {
        if (filterType === 'all') {
          renderVehiclesList(window.allVehiclesData);
        } else {
          const filtered = window.allVehiclesData.filter(v => 
            (v.type || '').toLowerCase().includes(filterType.toLowerCase()) ||
            (filterType === 'cars' && (v.type || '').toLowerCase() === 'cars') ||
            (filterType === 'bikes' && (v.type || '').toLowerCase() === 'bikes') ||
            (filterType === 'vans' && (v.type || '').toLowerCase() === 'vans')
          );
          renderVehiclesList(filtered);
        }
      }
    });
  });

  // Hero Search Button
  const btnHeroSearch = document.getElementById('btnHeroSearch');
  if (btnHeroSearch) {
    btnHeroSearch.addEventListener('click', () => {
      const type = document.getElementById('vehicleTypeSelect')?.value || 'all';
      if (window.allVehiclesData) {
        if (type === 'all') {
          renderVehiclesList(window.allVehiclesData);
        } else {
          const filtered = window.allVehiclesData.filter(v => (v.type || '').toLowerCase() === type.toLowerCase());
          renderVehiclesList(filtered);
        }
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

  // 2. Logos
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

  // 7. Social Links (Facebook: hide icon if empty)
  const fbLinks = document.querySelectorAll('#footerFbLink, a.soc-icon-btn[aria-label="Facebook Page"]');
  fbLinks.forEach(link => {
    const fbUrl = settings.facebook ? String(settings.facebook).trim() : '';
    if (fbUrl) {
      link.href = fbUrl;
      link.style.display = '';
    } else {
      link.style.display = 'none';
    }
  });
}

// DYNAMIC WEBSITE BACKGROUNDS MANAGER
async function applyDynamicBackgrounds() {
  try {
    const bgData = await getDoc('backgrounds', 'main') || await getDoc('settings', 'backgrounds');
    if (!bgData) return;

    const isSub = typeof window !== 'undefined' && window.location.pathname.includes('/admin/');
    const resolveBg = (val) => {
      if (!val) return '';
      return sanitizeCSSUrl(fixImgPath(val, isSub));
    };

    // 1. Home Hero (index.html)
    if (bgData.homeHero) {
      const heroSec = document.querySelector('.hero');
      if (heroSec) {
        const resolved = resolveBg(bgData.homeHero);
        if (resolved) {
          heroSec.style.backgroundImage = `linear-gradient(180deg, rgba(7, 7, 10, 0.25) 0%, rgba(7, 7, 10, 0.65) 100%), url('${resolved}')`;
          heroSec.style.backgroundSize = 'cover';
          heroSec.style.backgroundPosition = 'center center';
          heroSec.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 2. Our Fleet Hero (vehicles.html)
    if (bgData.fleetHero) {
      const fleetHero = document.querySelector('.rental-hero');
      if (fleetHero) {
        const resolved = resolveBg(bgData.fleetHero);
        if (resolved) {
          fleetHero.style.backgroundImage = `url('${resolved}')`;
          fleetHero.style.backgroundSize = 'cover';
          fleetHero.style.backgroundPosition = 'center center';
          fleetHero.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 3. Bookings Hero (bookings.html)
    if (bgData.bookingsHero) {
      const bookingsHero = document.querySelector('.bookings-hero');
      if (bookingsHero) {
        const resolved = resolveBg(bgData.bookingsHero);
        if (resolved) {
          bookingsHero.style.backgroundImage = `url('${resolved}')`;
          bookingsHero.style.backgroundSize = 'cover';
          bookingsHero.style.backgroundPosition = 'center center';
          bookingsHero.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 4. Bookings CTA Banner (bookings.html)
    if (bgData.bookingsCta) {
      const bookingsCta = document.querySelector('.bookings-cta-banner:not(.destinations-cta-banner)');
      if (bookingsCta) {
        const resolved = resolveBg(bgData.bookingsCta);
        if (resolved) {
          bookingsCta.style.backgroundImage = `url('${resolved}')`;
          bookingsCta.style.backgroundSize = 'cover';
          bookingsCta.style.backgroundPosition = 'center center';
          bookingsCta.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 5. Destinations Hero (destinations.html)
    if (bgData.destinationsHero) {
      const destHero = document.querySelector('.destinations-hero');
      if (destHero) {
        const resolved = resolveBg(bgData.destinationsHero);
        if (resolved) {
          destHero.style.backgroundImage = `url('${resolved}')`;
          destHero.style.backgroundSize = 'cover';
          destHero.style.backgroundPosition = 'center center';
          destHero.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 6. Destinations CTA Banner (destinations.html)
    const destCtaUrl = bgData.destinationsCta || bgData.bookingsCta;
    if (destCtaUrl) {
      const destCta = document.querySelector('.destinations-cta-banner');
      if (destCta) {
        const resolved = resolveBg(destCtaUrl);
        if (resolved) {
          destCta.style.backgroundImage = `url('${resolved}')`;
          destCta.style.backgroundSize = 'cover';
          destCta.style.backgroundPosition = 'center center';
          destCta.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 7. About Us Hero (about.html)
    if (bgData.aboutHero) {
      const aboutHero = document.querySelector('.about-hero');
      if (aboutHero) {
        const resolved = resolveBg(bgData.aboutHero);
        if (resolved) {
          aboutHero.style.backgroundImage = `url('${resolved}')`;
          aboutHero.style.backgroundSize = 'cover';
          aboutHero.style.backgroundPosition = 'center center';
          aboutHero.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 8. About Us Intro / Story Parallax (about.html)
    if (bgData.aboutIntro) {
      const aboutIntro = document.querySelector('.about-intro');
      if (aboutIntro) {
        const resolved = resolveBg(bgData.aboutIntro);
        if (resolved) {
          aboutIntro.style.backgroundImage = `url('${resolved}')`;
          aboutIntro.style.backgroundSize = 'cover';
          aboutIntro.style.backgroundPosition = 'center center';
        }
      }
    }

    // 9. About Us CTA Banner (about.html)
    if (bgData.aboutCta) {
      const aboutCta = document.querySelector('.about-cta-banner');
      if (aboutCta) {
        const resolved = resolveBg(bgData.aboutCta);
        if (resolved) {
          aboutCta.style.backgroundImage = `url('${resolved}')`;
          aboutCta.style.backgroundSize = 'cover';
          aboutCta.style.backgroundPosition = 'center center';
          aboutCta.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 10. Contact Us Hero (contact.html)
    if (bgData.contactHero) {
      const contactHero = document.querySelector('.contact-hero');
      if (contactHero) {
        const resolved = resolveBg(bgData.contactHero);
        if (resolved) {
          contactHero.style.backgroundImage = `url('${resolved}')`;
          contactHero.style.backgroundSize = 'cover';
          contactHero.style.backgroundPosition = 'center center';
          contactHero.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 11. Contact Us CTA Banner (contact.html)
    if (bgData.contactCta) {
      const contactCta = document.querySelector('.contact-cta-banner');
      if (contactCta) {
        const resolved = resolveBg(bgData.contactCta);
        if (resolved) {
          contactCta.style.backgroundImage = `url('${resolved}')`;
          contactCta.style.backgroundSize = 'cover';
          contactCta.style.backgroundPosition = 'center center';
          contactCta.style.backgroundRepeat = 'no-repeat';
        }
      }
    }

    // 12. FAQ Top Guidance Banner (faqs.html)
    if (bgData.faqsHero) {
      const faqsBanner = document.querySelector('.faqs-hero-banner');
      if (faqsBanner) {
        const resolved = resolveBg(bgData.faqsHero);
        if (resolved) {
          faqsBanner.style.backgroundImage = `linear-gradient(rgba(10, 10, 10, 0.82), rgba(10, 10, 10, 0.92)), url('${resolved}')`;
          faqsBanner.style.backgroundSize = 'cover';
          faqsBanner.style.backgroundPosition = 'center center';
          faqsBanner.style.backgroundRepeat = 'no-repeat';
        }
      }
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
      heroTitle.innerHTML = sanitizeHTML(homeData.hero.headline);
    }

    const heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && homeData.hero.subline) {
      heroDesc.textContent = homeData.hero.subline;
    }

    if (homeData.hero.bgImage) {
      const heroSec = document.querySelector('.hero');
      if (heroSec) {
        const cleanBg = sanitizeCSSUrl(homeData.hero.bgImage);
        if (cleanBg) {
          heroSec.style.background = `linear-gradient(180deg, rgba(7, 7, 10, 0.25) 0%, rgba(7, 7, 10, 0.65) 100%), url('${cleanBg}') center center / cover no-repeat`;
        }
      }
    }
  }

  // Why choose us items
  if (homeData.whyChooseUs && Array.isArray(homeData.whyChooseUs.items) && homeData.whyChooseUs.items.length > 0) {
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
      image: './assets/images/about/pexels-malindabandaralk-16508228.jpg',
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

    if (mode === 'inline' && yId) {
      cardEl.setAttribute('data-video', yId);
      cardEl.innerHTML = `
        <iframe class="disc-video-iframe" 
          src="https://www.youtube.com/embed/${yId}?autoplay=1&mute=1&loop=1&playlist=${yId}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1" 
          title="Sri Lanka Showcase" 
          frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
        <div class="disc-play">
          <div class="disc-play-btn" title="Watch full video with sound">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      `;
    } else {
      const imgSrc = data.image ? fixImgPath(data.image, false) : (yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : '');
      if (yId) cardEl.setAttribute('data-video', yId);
      cardEl.innerHTML = `
        <img src="${escapeHTML(imgSrc)}" alt="Sri Lanka Showcase" loading="lazy" decoding="async">
        <div class="disc-play">
          <div class="disc-play-btn" title="Watch video with sound">
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      `;
    }
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
      introImg.style.setProperty('max-height', 'none', 'important');
      introImg.style.setProperty('aspect-ratio', 'auto', 'important');
      introImg.style.setProperty('object-fit', 'contain', 'important');
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
              <a href="https://wa.me/${targetWa}?text=${waText}" target="_blank" rel="noopener" class="dest-btn-wa">
                <i class="fa-brands fa-whatsapp"></i> Rent Vehicle to Visit
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    initDestinationFilters();
  }
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

  window.addEventListener('resize', () => {
    createDots();
    updateSlider();
  });

  createDots();
  updateSlider();
  startTimer();
}

function renderVehiclesList(vehicles) {
  const grid = document.getElementById('featuredVehiclesGrid');
  if (!grid) return;

  if (vehicles.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-car-tunnel" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--yellow);"></i>
        <h3>No vehicles currently match your selection.</h3>
        <p style="font-size: 0.95rem;">Please check back soon or contact us directly on WhatsApp.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = vehicles.map(v => {
    const brandName = (v.type === 'Bikes') ? 'Danan Two-Wheelers' : 'Danan Rental Fleet';

    // Resolve PickMe vector outline images
    let imgUrl = (v.images && v.images.length > 0) ? v.images[0] : '';
    if (!imgUrl || imgUrl.includes('fleet-banner.jpeg') || imgUrl.includes('vehicle-')) {
      const lower = (v.name || '').toLowerCase();
      if (lower.includes('dio')) imgUrl = './assets/images/vehicles/vector-dio.png';
      else if (lower.includes('ntorq')) imgUrl = './assets/images/vehicles/vector-ntorq.png';
      else if (lower.includes('indian') || lower.includes('2014')) imgUrl = './assets/images/vehicles/vector-alto-indian.png';
      else if (lower.includes('japan') || lower.includes('alto')) imgUrl = './assets/images/vehicles/vector-alto-japan.png';
      else if (lower.includes('every') || lower.includes('van')) imgUrl = './assets/images/vehicles/vector-every-van.png';
      else if (lower.includes('wagon')) imgUrl = './assets/images/vehicles/vector-wagon-r.png';
      else imgUrl = './assets/images/vehicles/vector-wagon-r.png';
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
      <div data-book="${escapeHTML(v.id)}" class="rc reveal visible in" style="cursor: pointer;">
        <div class="rc-img">
          <img src="${escapeHTML(fixImgPath(imgUrl, false))}" alt="${escapeHTML(v.name)}" loading="lazy">
          <div class="rc-badge">${(v.available !== false) ? 'AVAILABLE' : 'BOOKED'}</div>
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
        <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 18px; margin-bottom: 14px;">
          <h4 style="font-size: 1.05rem; color: var(--white); margin-bottom: 6px;">${escapeHTML(f.question)}</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted);">${escapeHTML(f.answer)}</p>
        </div>
      `).join('');
    }
  }
}

// LOAD REVIEWS CAROUSEL
async function loadReviewsTrack() {
  const track = document.getElementById('testiTrack');
  if (!track) return;

  const reviews = await getCollection('reviews');
  const visible = reviews.filter(r => r.visible !== false);

  if (visible.length === 0) return;

  track.innerHTML = visible.map(r => `
    <div class="testi-card">
      <div class="testi-head">
        <div class="testi-av">
          <img src="${escapeHTML(fixImgPath(r.photo || './assets/images/customers/customer-1.jpeg', false))}" alt="${escapeHTML(r.name)}">
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

  const items = track.querySelectorAll('.why-item');
  if (items.length === 0) return;

  let currentIndex = 0;
  let autoSlideTimer = null;

  function getVisibleItemsCount() {
    const width = window.innerWidth;
    if (width <= 520) return 1;
    if (width <= 800) return 2;
    if (width <= 1100) return 3;
    return 4;
  }

  function getMaxIndex() {
    const visibleCount = getVisibleItemsCount();
    return Math.max(0, items.length - visibleCount);
  }

  function updateSlider() {
    const maxIdx = getMaxIndex();
    if (currentIndex > maxIdx) currentIndex = 0;
    if (currentIndex < 0) currentIndex = maxIdx;

    const itemWidth = items[0].offsetWidth;
    const gap = 20;
    const moveAmount = (itemWidth + gap) * currentIndex;
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
      dot.className = `why-dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateSlider();
        resetAutoSlide();
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

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(nextSlide, 5000);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) clearInterval(autoSlideTimer);
  }

  function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoSlide();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoSlide();
    });
  }

  // Touch swipe support for Why-Us carousel on Android and mobile
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      touchStartX = e.changedTouches[0].screenX;
    }
    stopAutoSlide();
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
    }
    resetAutoSlide();
  }, { passive: true });

  track.parentElement.addEventListener('mouseenter', stopAutoSlide);
  track.parentElement.addEventListener('mouseleave', startAutoSlide);

  // Pause carousel when tab is in background to save Android device battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoSlide();
    else startAutoSlide();
  });

  window.addEventListener('resize', () => {
    createDots();
    updateSlider();
  });

  createDots();
  updateSlider();
  startAutoSlide();
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

  function updateGalleryDisplay() {
    const itemMain = items[currentIndex % items.length];
    const itemOverlay = items[(currentIndex + 1) % items.length];

    imgMain.classList.add('about-img-fade');
    imgOverlay.classList.add('about-img-fade');

    setTimeout(() => {
      if (itemMain && itemMain.image) {
        imgMain.src = itemMain.image;
        if (captionText) captionText.textContent = itemMain.caption || "Verified Customer Photo";
      }
      if (itemOverlay && itemOverlay.image) {
        imgOverlay.src = itemOverlay.image;
      }

      imgMain.classList.remove('about-img-fade');
      imgOverlay.classList.remove('about-img-fade');
    }, 450);
  }

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

// BOOKING INQUIRY MODAL LOGIC
function initBookingInquiryModal() {
  const overlay = document.getElementById('bookingModalOverlay');
  const btnClose = document.getElementById('btnBmClose');
  const form = document.getElementById('bookingInquiryForm');
  const btnWhatsapp = document.getElementById('btnBmWhatsapp');

  if (!overlay || !form) return;

  const vehImg = document.getElementById('bmVehImg');
  const vehName = document.getElementById('bmVehName');
  const vehRate = document.getElementById('bmVehRate');
  const inputPickupDate = document.getElementById('bmPickupDate');
  const inputReturnDate = document.getElementById('bmReturnDate');
  const estTotalEl = document.getElementById('bmEstTotal');

  let activeVehPrice = 3000;
  let activeVehName = "Honda Dio 110cc";

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

  // Delegated click listener for data-book vehicles (avoids JS break with apostrophes)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-book]');
    if (!btn) return;
    if (e.target.closest('.rc-wishlist')) return;

    const vehId = btn.getAttribute('data-book');
    const veh = (window.allVehiclesData || []).find(v => String(v.id) === String(vehId));
    if (veh) {
      window.openBookingModal(veh);
    }
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

  window.openBookingModal = function(veh) {
    if (veh) {
      activeVehPrice = veh.price24h || 3000;
      activeVehName = veh.name || "Vehicle";
      const rawImg = (veh.images && veh.images.length > 0) ? veh.images[0] : './assets/images/vehicles/fleet-banner.jpeg';
      if (vehImg) vehImg.src = fixImgPath(rawImg, false);
      if (vehName) vehName.textContent = veh.name;
      if (vehRate) vehRate.textContent = `Rs. ${activeVehPrice.toLocaleString()} / day • ${veh.kmIncluded || 200} Free Km/Day`;
    }
    calcEstPrice();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeBookingModal = function() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  btnClose?.addEventListener('click', window.closeBookingModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.closeBookingModal();
  });

  // Ensure focused fields remain visible above Android on-screen keyboard
  form.querySelectorAll('.bm-input, .bm-select, .bm-textarea').forEach(field => {
    field.addEventListener('focus', () => {
      setTimeout(() => {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 280);
    });
  });

  // Process Booking Inquiry & Send to WhatsApp Synchronously
  function submitBookingInquiry() {
    const fullName = document.getElementById('bmFullName')?.value.trim() || '';
    const phone = document.getElementById('bmPhone')?.value.trim() || '';
    const pickupDate = inputPickupDate?.value || '';
    const returnDate = inputReturnDate?.value || '';
    const location = document.getElementById('bmPickupLoc')?.value || 'Kandy';
    const permit = document.getElementById('bmPermitStatus')?.value || 'Standard';
    const notes = document.getElementById('bmNotes')?.value.trim() || 'None';

    if (!fullName || !phone || !pickupDate || !returnDate) {
      alert("Please enter your Name, Phone Number, and Pickup/Return dates.");
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 7) {
      alert("Please enter a valid phone number (at least 7 digits).");
      return;
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const nowThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1hr skew grace

    if (start < nowThreshold) {
      alert("Pick-up date and time cannot be in the past. Please choose an upcoming date.");
      return;
    }

    if (end <= start) {
      alert("Drop-off / Return date must be after your pick-up date.");
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

    // Format WhatsApp Message to single source of truth number
    const targetWa = normalizeWhatsAppNumber(window.siteSettings?.whatsapp || '94772013059');
    const msg = `Hello Danan Rentals! 👋\n\nI would like to book a vehicle:\n\n🚗 *Vehicle:* ${activeVehName}\n👤 *Name:* ${fullName}\n📞 *Phone:* ${phone}\n📍 *Location:* ${location}\n📅 *Pickup:* ${pickupDate.replace('T', ' ')}\n📅 *Return:* ${returnDate.replace('T', ' ')} (${days} ${days === 1 ? 'Day' : 'Days'})\n💰 *Est. Total:* Rs. ${estTotal.toLocaleString()}\n📜 *Permit:* ${permit}\n💬 *Notes:* ${notes}\n\nPlease confirm availability & booking!`;

    const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(msg)}`;

    // Open WhatsApp SYNCHRONOUSLY on the user click to prevent iOS Safari tab blocking!
    window.open(waUrl, '_blank');

    // Save inquiry to Database in the background (NON-AWAITED before window.open)
    saveDoc('bookings', bookingId, payload).catch(err => {
      console.warn("Background save booking notice:", err);
    });

    const btnSubmit = document.getElementById('btnBmSubmit');
    if (btnSubmit) {
      btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Inquiry via WhatsApp`;
    }

    window.closeBookingModal();
  }

  btnWhatsapp?.addEventListener('click', submitBookingInquiry);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBookingInquiry();
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
}

