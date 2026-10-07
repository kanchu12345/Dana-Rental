import { auth, seedInitialData } from './db.js';
import { isFirebaseConfigured } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminAuth();
  initAdminNavigation();
  initSeedButton();
  initLogoutButton();
});

// Admin Authentication Enforcement
async function checkAdminAuth() {
  const isLoginPage = window.location.pathname.includes('login.html');
  const isDemoLoggedIn = localStorage.getItem('danan_admin_logged_in') === 'true';

  if (isFirebaseConfigured() && auth) {
    try {
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      onAuthStateChanged(auth, (user) => {
        const hasAccess = !!user || isDemoLoggedIn;
        if (!hasAccess && !isLoginPage) {
          window.location.href = './login.html';
        } else if (hasAccess && isLoginPage) {
          window.location.href = './index.html';
        }
      });
    } catch (err) {
      if (!isDemoLoggedIn && !isLoginPage) {
        window.location.href = './login.html';
      }
    }
  } else {
    // Demo mode login fallback
    if (!isDemoLoggedIn && !isLoginPage) {
      window.location.href = './login.html';
    } else if (isDemoLoggedIn && isLoginPage) {
      window.location.href = './index.html';
    }
  }
}

// Active Sidebar Link Highlight
function initAdminNavigation() {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  
  navItems.forEach(item => {
    if (currentPath.includes(item.getAttribute('href'))) {
      item.classList.add('active');
    }
  });

  // Mobile menu sidebar toggle
  const sidebarToggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
}

// Seed Data Handler
function initSeedButton() {
  const btnSeed = document.getElementById('btnSeedData');
  if (btnSeed) {
    btnSeed.addEventListener('click', async () => {
      if (!confirm("Are you sure you want to seed default data? This will overwrite or initialize default site data.")) return;

      btnSeed.disabled = true;
      btnSeed.textContent = "Seeding data...";
      showToast("Seeding initial website content...");

      try {
        const logs = await seedInitialData();
        showToast("Initial data seeded successfully!", "success");
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        console.error("Seed failed:", err);
        showToast("Error seeding data: " + err.message, "error");
      } finally {
        btnSeed.disabled = false;
        btnSeed.textContent = "Seed Default Data";
      }
    });
  }
}

// Logout Action
function initLogoutButton() {
  const logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isFirebaseConfigured() && auth) {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        await signOut(auth);
      }
      localStorage.removeItem('danan_admin_logged_in');
      showToast("Logged out successfully.");
      setTimeout(() => {
        window.location.href = './login.html';
      }, 500);
    });
  }
}

// Global Toast Notification Helper
export function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}
