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

  // 4. Interactive Visual Switcher for Showcase Items (Mars Explorer, etc.)
  const switchers = document.querySelectorAll('[data-view-switcher]');
  switchers.forEach(switcher => {
    const targetImgId = switcher.getAttribute('data-target-img');
    const targetCaptionId = switcher.getAttribute('data-target-caption');
    const targetImg = document.getElementById(targetImgId);
    const targetCaption = document.getElementById(targetCaptionId);
    const buttons = switcher.querySelectorAll('.view-tab-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const src = btn.getAttribute('data-src');
        const alt = btn.getAttribute('data-alt');
        const caption = btn.getAttribute('data-caption');

        if (targetImg && src) {
          targetImg.src = src;
          if (alt) targetImg.alt = alt;
        }

        if (targetCaption && caption) {
          targetCaption.textContent = caption;
        }

        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });
});
