/* ============================================================
   SOHRAB AHMADPUR — Portfolio JS
   Custom cursor · Preloader · Magnetic · Active nav · Reveal
   ============================================================ */
(function () {
  'use strict';

  // ── Helpers ─────────────────────────────────────────────
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => [...(ctx || document).querySelectorAll(sel)];

  // ── DOM refs ─────────────────────────────────────────────
  const preloader    = $('#preloader');
  const cDot         = $('#cDot');
  const cRing        = $('#cRing');
  const scrollProg   = $('#scrollProg');
  const mobHeader    = $('#mobHeader');
  const burger       = $('#burger');
  const mobNav       = $('#mobNav');
  const navItems     = $$('.nav-item');
  const sections     = $$('section[id]');
  const reveals      = $$('.reveal');
  const magnetics    = $$('.magnetic');

  // ── Preloader ─────────────────────────────────────────────
  // Complete preloader after load (min 1.4s for the animation)
  const PRELOAD_MIN = 1400;
  const loadStart   = Date.now();

  function dismissPreloader() {
    const elapsed = Date.now() - loadStart;
    const wait    = Math.max(0, PRELOAD_MIN - elapsed);
    setTimeout(function () {
      preloader.classList.add('done');
    }, wait);
  }

  if (document.readyState === 'complete') {
    dismissPreloader();
  } else {
    window.addEventListener('load', dismissPreloader);
  }

  // ── Scroll progress bar ────────────────────────────────────
  function updateScrollProg() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    scrollProg.style.width = pct + '%';
  }

  // ── Custom cursor (pointer devices only) ──────────────────
  var mx = window.innerWidth / 2;
  var my = window.innerHeight / 2;
  var rx = mx, ry = my;
  var rafId;

  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      cDot.style.transform = 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)';
    });

    function animateRing() {
      rx += (mx - rx) * 0.10;
      ry += (my - ry) * 0.10;
      cRing.style.transform = 'translate(' + (rx - 20) + 'px,' + (ry - 20) + 'px)';
      rafId = requestAnimationFrame(animateRing);
    }
    animateRing();

    // Ring grows on interactive elements
    var interactives = 'a, button, [role="button"], .exp-card, .stat-cell, .lang-card';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(interactives)) cRing.classList.add('hovered');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(interactives)) cRing.classList.remove('hovered');
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', function () {
      cDot.style.opacity  = '0';
      cRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      cDot.style.opacity  = '1';
      cRing.style.opacity = '1';
    });
  }

  // ── Magnetic buttons ──────────────────────────────────────
  magnetics.forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width  / 2;
      var y = e.clientY - rect.top  - rect.height / 2;
      el.style.transform = 'translate(' + (x * 0.18) + 'px,' + (y * 0.18) + 'px)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
    });
  });

  // ── Active nav on scroll ──────────────────────────────────
  function updateActiveNav() {
    var scrollY = window.scrollY;

    // Find which section is in view
    var currentId = '';
    sections.forEach(function (sec) {
      var top    = sec.offsetTop - 200;
      var bottom = top + sec.offsetHeight;
      if (scrollY >= top && scrollY < bottom) currentId = sec.id;
    });

    navItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.s === currentId);
    });
  }

  // ── Scroll-reveal via IntersectionObserver ────────────────
  var ioReveal = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          ioReveal.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
  );

  // Also observe about-body paragraphs
  $$('.about-body p').forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.setProperty('--delay', (i * 90) + 'ms');
    ioReveal.observe(el);
  });

  reveals.forEach(function (el) { ioReveal.observe(el); });

  // ── Scroll handler ────────────────────────────────────────
  window.addEventListener('scroll', function () {
    updateScrollProg();
    updateActiveNav();
  }, { passive: true });

  updateScrollProg();
  updateActiveNav();

  // ── Mobile nav ────────────────────────────────────────────
  var mobNavOpen = false;

  function openMobNav() {
    mobNavOpen = true;
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    mobNav.classList.add('open');
    mobNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMobNav() {
    mobNavOpen = false;
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    mobNav.classList.remove('open');
    mobNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', function () {
    mobNavOpen ? closeMobNav() : openMobNav();
  });

  // Close on any mobile nav link click
  $$('.mob-nav__link').forEach(function (link) {
    link.addEventListener('click', closeMobNav);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobNavOpen) {
      closeMobNav();
      burger.focus();
    }
  });

  // ── Smooth scroll for anchor links ────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var offset = 80;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  // ── Footer year ───────────────────────────────────────────
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

})();
