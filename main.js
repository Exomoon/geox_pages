/**
 * GeoX — Minimal Interaction Script
 * Where location meets data.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll blur indicator
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 24) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 2. Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const siteNav = document.getElementById('site-nav');

  if (mobileToggle && siteNav) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    siteNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Robust video autoplay handling
  const video = document.querySelector('.hero-video');
  if (video) {
    video.play().catch(() => {
      // Autoplay blocked (e.g. battery saver mode) — poster will seamlessly display
    });
  }
});
