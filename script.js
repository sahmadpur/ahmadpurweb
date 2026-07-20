/* ============================================================
   SOHRAB AHMADPUR — script.js
   UI layer: mobile nav · scroll spy · reveals · rail progress
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* WebGL support gate — scene.js also sets this on any init failure */
  if (!('WebGLRenderingContext' in window)) {
    document.documentElement.classList.add('no-webgl');
  }

  /* Footer year */
  var yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Mobile nav */
  var burger = $('#burger');
  var mobNav = $('#mobNav');
  var mobNavClose = $('#mobNavClose');

  function setNav(open) {
    mobNav.classList.toggle('open', open);
    mobNav.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (burger && mobNav) {
    burger.addEventListener('click', function () { setNav(!mobNav.classList.contains('open')); });
    mobNavClose.addEventListener('click', function () { setNav(false); });
    $$('.mob-nav__link').forEach(function (l) {
      l.addEventListener('click', function () { setNav(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobNav.classList.contains('open')) setNav(false);
    });
  }

  /* Scroll reveals */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Scroll spy for rail */
  var links = $$('.nav-link');
  var sections = links.map(function (l) { return document.getElementById(l.dataset.s); }).filter(Boolean);

  function setActive(id) {
    links.forEach(function (l) { l.classList.toggle('active', l.dataset.s === id); });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* Rail progress fill */
  var railFill = $('#railFill');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      if (railFill) railFill.style.height = (p * 100).toFixed(2) + '%';
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Inertial scroll (desktop wheel only) ──────────────
     Wheel input moves a target; the page glides toward it
     with capped velocity so the 3D flight always stays
     cinematic. Touch, keyboard, and reduced-motion users
     keep native scrolling. */
  var finePointer = matchMedia('(pointer: fine)').matches;
  var noMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (finePointer && !noMotion) {
    var targetY = window.scrollY;
    var currentY = window.scrollY;
    var gliding = false;
    var lastT = 0;
    var MAX_SPEED = 2800;     /* px per second, regardless of refresh rate */

    var maxScroll = function () {
      return document.documentElement.scrollHeight - window.innerHeight;
    };

    var glide = function (now) {
      var dt = Math.min((now - lastT) / 1000 || 0.016, 0.05);
      lastT = now;

      var k = 1 - Math.exp(-5.5 * dt);          /* framerate-independent ease */
      var delta = (targetY - currentY) * k;
      var cap = MAX_SPEED * dt;
      if (delta > cap) delta = cap;
      if (delta < -cap) delta = -cap;
      currentY += delta;

      if (Math.abs(targetY - currentY) < 0.5) {
        currentY = targetY;
        gliding = false;
      }
      window.scrollTo({ top: currentY, behavior: 'instant' });
      if (gliding) requestAnimationFrame(glide);
    };

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;                    /* pinch-zoom */
      if (mobNav && mobNav.classList.contains('open')) return;
      e.preventDefault();

      var dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;          /* line mode (Firefox) */
      if (e.deltaMode === 2) dy *= window.innerHeight;

      targetY = Math.max(0, Math.min(maxScroll(), targetY + dy));
      if (!gliding) { gliding = true; lastT = performance.now(); requestAnimationFrame(glide); }
    }, { passive: false });

    /* Resync when scrolling happens outside the glide loop
       (anchor links, keyboard, scrollbar drag) */
    window.addEventListener('scroll', function () {
      if (!gliding) { targetY = currentY = window.scrollY; }
    }, { passive: true });
  }

})();
