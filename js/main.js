import { getDoc, getCollection, escapeHTML, fixImgPath } from './db.js';

document.addEventListener('DOMContentLoaded', async () => {
  initHeroTabSwitcher();
  initTestimonialsCarousel();
  initWhyCarousel();
  initScrollAndMobileListeners();
  initScrollReveal();
  initFlatpickrDates();
  try { await loadSiteSettings(); } catch (e) { console.warn('loadSiteSettings error:', e); }
  try { await loadHomePageData(); } catch (e) { console.warn('loadHomePageData error:', e); }
  try { await loadVehiclesGrid(); } catch (e) { console.warn('loadVehiclesGrid error:', e); }
  try { await loadRulesAndFaqs(); } catch (e) { console.warn('loadRulesAndFaqs error:', e); }
  try { await loadReviewsTrack(); } catch (e) { console.warn('loadReviewsTrack error:', e); }
  try { await initCustomerGallerySwap(); } catch (e) { console.warn('initCustomerGallerySwap error:', e); }
});

// SCROLL REVEAL ANIMATIONS
function initScrollReveal() {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in', 'visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in', 'visible'));
  }
}

// FLATPICKR DATEPICKER ANIMATIONS
function initFlatpickrDates() {
  if (typeof flatpickr !== 'undefined') {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const endInput = document.getElementById('home-enddate');
    let endPicker = null;
    if (endInput) {
      endPicker = flatpickr('#home-enddate', {
        minDate: tomorrow,
        dateFormat: 'Y-m-d',
        defaultDate: tomorrow
      });
    }

    const startInput = document.getElementById('home-startdate');
    if (startInput) {
      flatpickr('#home-startdate', {
        minDate: today,
        dateFormat: 'Y-m-d',
        defaultDate: today,
        onChange: function(dates) {
          if (dates[0] && endPicker) {
            const minOut = new Date(dates[0]);
            minOut.setDate(minOut.getDate() + 1);
            endPicker.set('minDate', minOut);
            if (!endPicker.selectedDates[0] || endPicker.selectedDates[0] < minOut) {
              endPicker.setDate(minOut, true);
            }
          }
        }
      });
    }
  }
}

// SCROLL & MOBILE MENU LISTENERS
function initScrollAndMobileListeners() {
  const navbar = document.getElementById('navbar');
  const stickySearch = document.getElementById('stickySearch');
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY || window.pageYOffset;

    if (navbar) {
      if (scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    if (stickySearch) {
      if (scrollY > 350) {
        stickySearch.classList.add('visible');
      } else {
        stickySearch.classList.remove('visible');
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
          const filtered = window.allVehiclesData.filter(v => 
            (v.type || '').toLowerCase().includes(type.toLowerCase())
          );
          renderVehiclesList(filtered);
        }
      }
      const grid = document.getElementById('rentals');
      if (grid) grid.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// LOAD GLOBAL SITE SETTINGS
async function loadSiteSettings() {
  const settings = await getDoc('settings', 'site');
  window.siteSettings = settings || {};

  if (!settings) return;

  // Favicon
  if (settings.favicon) {
    let faviconLink = document.querySelector("link[rel='icon']");
    if (faviconLink) faviconLink.href = settings.favicon;
  }

  // Logos
  const logoImgs = document.querySelectorAll('.nav-logo img, .footer-logo img');
  logoImgs.forEach(img => {
    if (settings.logo) img.src = settings.logo;
    img.alt = settings.businessName || 'Danan Rentals';
  });

  // Theme colors override
  if (settings.theme) {
    if (settings.theme.primaryRed) {
      document.documentElement.style.setProperty('--primary-red', settings.theme.primaryRed);
    }
  }
}

// LOAD HOME PAGE DATA
async function loadHomePageData() {
  const homeData = await getDoc('pages', 'home');
  if (!homeData) return;

  if (homeData.hero) {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && homeData.hero.headline) {
      heroTitle.innerHTML = escapeHTML(homeData.hero.headline).replace(/Kandy & Peradeniya/g, '<span>Kandy & Peradeniya</span>');
    }

    const heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && homeData.hero.subline) {
      heroDesc.textContent = homeData.hero.subline;
    }

    if (homeData.hero.bgImage) {
      const heroSec = document.querySelector('.hero');
      if (heroSec) {
        heroSec.style.background = `linear-gradient(180deg, rgba(7, 7, 10, 0.25) 0%, rgba(7, 7, 10, 0.65) 100%), url('${homeData.hero.bgImage}') center center / cover no-repeat`;
      }
    }
  }
}

// LOAD VEHICLES GRID (RENTO STYLE `.rc.reveal` WITH AUTO-SWAP CAROUSEL)
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

  const vehicles = await getCollection('vehicles');
  const available = vehicles.filter(v => v.available !== false);
  window.allVehiclesData = available;

  renderVehiclesList(available);

  // Initialize auto-swap 4-card carousel if wrapper exists on page
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

  function updateCarousel() {
    const visible = getVisibleCards();
    const maxIdx = getMaxIndex();

    if (currentIndex > maxIdx) currentIndex = 0;
    if (currentIndex < 0) currentIndex = maxIdx;

    // Shift track percentages accurately
    const cardStep = 100 / visible;
    track.style.transform = `translateX(-${currentIndex * (cardStep + 1.8)}%)`;

    // Update Dots
    if (dotsContainer) {
      const dotCount = maxIdx + 1;
      dotsContainer.innerHTML = Array(dotCount).fill(0).map((_, i) => `
        <span class="fleet-dot ${i === currentIndex ? 'active' : ''}" data-idx="${i}"></span>
      `).join('');

      dotsContainer.querySelectorAll('.fleet-dot').forEach(dot => {
        dot.onclick = () => {
          currentIndex = parseInt(dot.getAttribute('data-idx'));
          updateCarousel();
          resetTimer();
        };
      });
    }
  }

  function nextSlide() {
    const maxIdx = getMaxIndex();
    if (currentIndex >= maxIdx) {
      currentIndex = 0;
    } else {
      currentIndex++;
    }
    updateCarousel();
  }

  function prevSlide() {
    const maxIdx = getMaxIndex();
    if (currentIndex <= 0) {
      currentIndex = maxIdx;
    } else {
      currentIndex--;
    }
    updateCarousel();
  }

  if (nextBtn) nextBtn.onclick = () => { nextSlide(); resetTimer(); };
  if (prevBtn) prevBtn.onclick = () => { prevSlide(); resetTimer(); };

  function startTimer() {
    stopTimer();
    fleetCarouselTimer = setInterval(nextSlide, 3500);
  }

  function stopTimer() {
    if (fleetCarouselTimer) clearInterval(fleetCarouselTimer);
  }

  function resetTimer() {
    startTimer();
  }

  wrapper.onmouseenter = stopTimer;
  wrapper.onmouseleave = startTimer;
  window.onresize = updateCarousel;

  updateCarousel();
  startTimer();
}

function renderVehiclesList(vehicles) {
  const grid = document.getElementById('featuredVehiclesGrid');
  if (!grid) return;

  if (!vehicles || vehicles.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px; font-size: 1.1rem;">No vehicles found in this category.</div>`;
    return;
  }

  const whatsappPhone = window.siteSettings?.whatsapp || '94772013059';

  grid.innerHTML = vehicles.map(v => {
    const imgUrl = (v.images && v.images.length > 0) ? v.images[0] : './assets/images/vehicles/fleet-banner.jpeg';
    const bookMsg = `Hello Danan Car & Bike Rentals, I would like to book the ${v.name} (Rs. ${v.price24h}/24h). Please inform me about availability.`;
    const waUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(bookMsg)}`;
    
    // Extract brand name or default
    const brandName = (v.name.split(' ')[0] || 'VEHICLE').toUpperCase();

    return `
      <a href="${waUrl}" target="_blank" class="rc reveal visible in">
        <div class="rc-img">
          <img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(v.name)}" loading="lazy">
          <div class="rc-badge">AVAILABLE</div>
          <button class="rc-wishlist" onclick="event.preventDefault(); event.stopPropagation();" aria-label="Add to wishlist">
            <i class="fa-regular fa-heart"></i>
          </button>
        </div>
        <div class="rc-body">
          <div class="rc-type">${escapeHTML(brandName)}</div>
          <div class="rc-name">${escapeHTML(v.name)}</div>
          <div class="rc-tags">
            <span class="rc-tag"><i class="fa-solid fa-shield"></i> Insurance</span>
            <span class="rc-tag"><i class="fa-solid fa-gauge-high"></i> ${v.kmIncluded || 200}km / Day</span>
            ${v.deposit ? `<span class="rc-tag"><i class="fa-solid fa-hand-holding-dollar"></i> Refund Deposit Rs. ${v.deposit.toLocaleString()}</span>` : ''}
            ${v.extraKmRate ? `<span class="rc-tag"><i class="fa-solid fa-road"></i> Extra Km: Rs. ${v.extraKmRate}</span>` : ''}
            ${v.extraHourRate ? `<span class="rc-tag"><i class="fa-solid fa-clock"></i> Extra Hr: Rs. ${v.extraHourRate}</span>` : ''}
            <span class="rc-tag"><i class="fa-solid fa-gas-pump"></i> ${escapeHTML(v.fuel || 'Petrol')}</span>
          </div>
          <hr class="rc-divider">
          <div class="rc-footer">
            <div class="rc-price">Rs. ${v.price24h ? v.price24h.toLocaleString() : 0} <sub>/day</sub></div>
            <button class="rc-btn">BOOK NOW</button>
          </div>
        </div>
      </a>
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
    if (rules.length > 0) {
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
    if (faqs.length > 0) {
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
          <img src="${escapeHTML(r.photo || './assets/images/customers/customer-1.jpeg')}" alt="${escapeHTML(r.name)}">
        </div>
        <div>
          <div class="testi-name">${escapeHTML(r.name)}</div>
          <div style="font-size: 0.78rem; color: var(--yellow); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            <i class="fa-brands fa-google" style="color:#4285F4;"></i> ${escapeHTML(r.source || 'Google Review')}
          </div>
        </div>
      </div>
      <div class="testi-stars">
        <i class="fa-solid fa-star" style="color:#FFB800;"></i>
        <i class="fa-solid fa-star" style="color:#FFB800;"></i>
        <i class="fa-solid fa-star" style="color:#FFB800;"></i>
        <i class="fa-solid fa-star" style="color:#FFB800;"></i>
        <i class="fa-solid fa-star" style="color:#FFB800;"></i>
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

// WHY CHOOSE US AUTO-SWAP CAROUSEL (12 CARDS, 4 VISIBLE AT A TIME)
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
    return 4; // 4 cards at a time on desktop
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

    // Update dots
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
    autoSlideTimer = setInterval(nextSlide, 3500); // Auto swaps every 3.5 seconds
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

  // Pause on hover
  track.parentElement.addEventListener('mouseenter', stopAutoSlide);
  track.parentElement.addEventListener('mouseleave', startAutoSlide);

  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; stopAutoSlide(); }, { passive: true });
  track.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 40) nextSlide();
    if (touchEndX - touchStartX > 40) prevSlide();
    startAutoSlide();
  }, { passive: true });

  window.addEventListener('resize', () => {
    createDots();
    updateSlider();
  });

  createDots();
  updateSlider();
  startAutoSlide();
}

// AUTO-SWAP CUSTOMER GALLERY (Every 5 seconds)
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

  updateGalleryDisplay();

  // If there are 2 or more images, auto-swap every 5 seconds (5000ms)
  if (items.length > 1) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % items.length;
      updateGalleryDisplay();
    }, 5000);
  }
}
