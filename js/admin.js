// Admin management script: auth gating, navigation, seeding and toasts
import { initFirebase, auth, getDoc, seedInitialData } from './db.js';
import { isFirebaseConfigured } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();
  initAdminNavigation();
  initSeedButton();
  initLogoutButton();
});

// Admin Authentication Enforcement: Strictly gated on Firebase Auth user
export async function checkAdminAuth() {
  const isLoginPage = window.location.pathname.includes('login.html');

  try {
    const { auth: initializedAuth } = await initFirebase();
    const activeAuth = initializedAuth || auth;

    if (!activeAuth) {
      if (!isLoginPage) {
        window.location.replace('./login.html');
      }
      return;
    }

    const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');

    onAuthStateChanged(activeAuth, (user) => {
      if (user) {
        // Authenticated admin user
        if (isLoginPage) {
          window.location.replace('./index.html');
        } else {
          document.body.classList.add('auth-ready');
        }
      } else {
        // Unauthenticated visitor
        if (!isLoginPage) {
          window.location.replace('./login.html');
        }
      }
    });
  } catch (err) {
    console.error("Admin auth verification error:", err);
    if (!isLoginPage) {
      window.location.replace('./login.html');
    }
  }
}

// Active Sidebar Link Highlight & Mobile Drawer Support
function initAdminNavigation() {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && currentPath.endsWith(href)) {
      item.classList.add('active');
    }
  });

  const topbar = document.querySelector('.admin-topbar');
  let sidebarToggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.admin-sidebar');

  // Dynamically insert mobile hamburger toggle button into topbar if missing
  if (topbar && !sidebarToggleBtn) {
    sidebarToggleBtn = document.createElement('button');
    sidebarToggleBtn.id = 'sidebarToggle';
    sidebarToggleBtn.className = 'admin-sidebar-toggle';
    sidebarToggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
    sidebarToggleBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    topbar.prepend(sidebarToggleBtn);
  }

  // Create backdrop overlay for admin drawer if not present
  let adminOverlay = document.querySelector('.admin-sidebar-overlay');
  if (sidebar && !adminOverlay) {
    adminOverlay = document.createElement('div');
    adminOverlay.className = 'admin-sidebar-overlay';
    document.body.appendChild(adminOverlay);
  }

  function openAdminDrawer() {
    sidebar?.classList.add('active');
    adminOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAdminDrawer() {
    sidebar?.classList.remove('active');
    adminOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  sidebarToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar?.classList.contains('active')) {
      closeAdminDrawer();
    } else {
      openAdminDrawer();
    }
  });

  adminOverlay?.addEventListener('click', closeAdminDrawer);

  sidebar?.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', closeAdminDrawer);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('active')) {
      closeAdminDrawer();
    }
  });
}

// Seed Data Handler with protection against overwriting admin changes
async function initSeedButton() {
  const btnSeed = document.getElementById('btnSeedData');
  if (!btnSeed) return;

  // Check if data is already seeded in Firestore
  try {
    const meta = await getDoc('settings', 'meta');
    if (meta && meta.seeded) {
      btnSeed.title = "Default content is already seeded. Click to re-seed (requires typing RESET).";
    }
  } catch (e) {}

  btnSeed.addEventListener('click', async () => {
    let force = false;
    try {
      const meta = await getDoc('settings', 'meta');
      if (meta && meta.seeded) {
        const confirmWord = prompt("Default site data is already seeded in Firestore!\n\nTo safely fill any MISSING items without overwriting, click OK with a blank box.\n\nTo OVERWRITE/RESET all documents back to initial defaults, type 'RESET' below:");
        if (confirmWord === null) return;
        if (confirmWord.trim() === 'RESET') {
          force = true;
        }
      } else {
        if (!confirm("Are you sure you want to seed default site data into Firestore?")) return;
      }
    } catch (e) {
      if (!confirm("Seed default data to Firestore?")) return;
    }

    btnSeed.disabled = true;
    const oldText = btnSeed.textContent;
    btnSeed.textContent = "⏳ Seeding data...";
    showToast("Writing content to Firestore...", "info");

    try {
      const result = await seedInitialData(force);
      showToast("Default data seeded successfully!", "success");
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      console.error("Seed failed:", err);
      showToast("Error seeding data: " + err.message, "error");
    } finally {
      btnSeed.disabled = false;
      btnSeed.textContent = oldText;
    }
  });
}

// Logout Action
function initLogoutButton() {
  const logoutBtn = document.getElementById('btnLogout');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const { auth: initializedAuth } = await initFirebase();
      const activeAuth = initializedAuth || auth;
      if (activeAuth) {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        await signOut(activeAuth);
      }
    } catch (err) {
      console.warn("Sign-out notice:", err);
    }
    showToast("Logged out successfully.");
    setTimeout(() => {
      window.location.replace('./login.html');
    }, 400);
  });
}

// Global Toast Notification Helper with XSS escaping via textContent
export function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const span = document.createElement('span');
  span.textContent = String(message);
  toast.appendChild(span);

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4500);
}
