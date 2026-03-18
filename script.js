/* ============================================================
   SOHRAB AHMADPUR — script.js
   Minimal JS: mobile nav · active nav · scroll reveal · footer year
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ── Mobile nav ──────────────────────────────────────── */
  var burger      = $('#burger');
  var mobNav      = $('#mobNav');
  var mobNavClose = $('#mobNavClose');
  var mobOpen     = false;

  function openNav() {
    mobOpen = true;
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    mobNav.classList.add('open');
    mobNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    mobOpen = false;
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    mobNav.classList.remove('open');
    mobNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (burger) burger.addEventListener('click', function () { mobOpen ? closeNav() : openNav(); });
  if (mobNavClose) mobNavClose.addEventListener('click', closeNav);

  $$('.mob-nav__link').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobOpen) { closeNav(); if (burger) burger.focus(); }
  });

  /* ── Smooth scroll for anchor links ──────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = window.innerWidth <= 768 ? 64 : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ── Active nav link on scroll ────────────────────────── */
  var navLinks = $$('.nav-link');
  var sections = $$('section[id]');

  function updateNav() {
    var scrollY = window.pageYOffset;
    var current = '';

    sections.forEach(function (sec) {
      var top    = sec.offsetTop - 140;
      var bottom = top + sec.offsetHeight;
      if (scrollY >= top && scrollY < bottom) current = sec.id;
    });

    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.dataset.s === current);
    });
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Scroll reveal via IntersectionObserver ───────────── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* ── Footer year ──────────────────────────────────────── */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

})();
