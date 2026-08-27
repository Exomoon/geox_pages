/**
 * GeoX Digital Product Studio — Main Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Set Current Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 3. Theme Toggle Support
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlRoot = document.documentElement;

  const savedTheme = localStorage.getItem('geox_theme');
  if (savedTheme) {
    htmlRoot.setAttribute('data-theme', savedTheme);
  } else {
    // Default to dark mode for Nordic studio aesthetic
    htmlRoot.setAttribute('data-theme', 'dark');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlRoot.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlRoot.setAttribute('data-theme', newTheme);
      localStorage.setItem('geox_theme', newTheme);
    });
  }

  // 4. Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      const isOpen = navLinks.classList.contains('mobile-open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 5. Scroll Header Indicator
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Re-run lucide icons if DOM updates
  setTimeout(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, 100);
});
