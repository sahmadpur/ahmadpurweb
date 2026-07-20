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

})();
