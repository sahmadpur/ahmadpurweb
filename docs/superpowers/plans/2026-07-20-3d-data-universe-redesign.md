# 3D Data Universe Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as a dark cinematic single-page experience with a scroll-driven 3D particle universe (chaos → order) with motion blur, keeping all content and SEO.

**Architecture:** Static site, no build step. A fullscreen fixed WebGL canvas (`scene.js`, Three.js via CDN import map) renders behind a content layer of glass panels (`index.html` + `styles.css`). Scroll position drives both the camera flight/formation morphing and content reveals (`script.js`).

**Tech Stack:** Vanilla HTML/CSS/JS, Three.js 0.16x via jsDelivr CDN import map, `three/addons` EffectComposer + UnrealBloomPass + AfterimagePass, Google Fonts.

## Global Constraints

- No build tooling, no npm, no frameworks — must deploy as-is to GitHub Pages.
- All existing copy, section content, JSON-LD, and meta tags preserved verbatim (typography/markup may change, words may not).
- Three.js version pinned in the import map (e.g. `three@0.169.0`) — never `latest`.
- Fallback chain: full 3D → reduced (mobile/weak GPU) → static drift (`prefers-reduced-motion`) → CSS gradient only (no WebGL / CDN failure). Page must be fully readable in every tier.
- Verification is in-browser via Chrome DevTools MCP: zero console errors, screenshots per journey stage, smooth scroll performance.

## Journey map (shared contract)

Normalized scroll progress `p` (0 at top, 1 at document end) drives everything:

| p | Section | Formation index | Formation |
|---|---|---|---|
| 0.00 | Hero | 0 | chaotic nebula |
| 0.22 | Who I Am | 1 | orbital halo |
| 0.45 | What I Do | 2 | three clusters |
| 0.70 | Story + Impact | 3 | timeline stream |
| 1.00 | Let's Talk | 4 | calm lattice |

`scene.js` exposes nothing; it reads scroll itself. `script.js` and `scene.js` are independent modules — communication only via DOM/scroll state and the `html.no-webgl` class fallback hook.

---

### Task 1: Content layer — `index.html` restructure

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: `<canvas id="scene">` (fixed background), `<div class="page">` content wrapper, sections with ids `hero, about, services, story, impact, contact` (unchanged ids), `nav` links with `data-s` attributes, `<script type="importmap">` pinning three, `<script type="module" src="scene.js">`, `<script src="script.js" defer>`.

- [ ] **Step 1:** Rewrite `index.html`: keep `<head>` meta/JSON-LD/canonical verbatim; swap font links to the new pairing (display + sans, single Google Fonts request); add `<canvas id="scene" aria-hidden="true">` as first body child; replace sidebar with slim fixed progress nav (desktop) while keeping the mobile burger/overlay pattern; keep every section's copy word-for-word inside new panel markup; add import map + module script for `scene.js`.
- [ ] **Step 2:** Verify: `python3 -m http.server` + open in Chrome — all content present, no console errors (scene.js may 404 until Task 4 — acceptable placeholder: create empty `scene.js`).
- [ ] **Step 3:** Commit: `git commit -m "Restructure content layer for 3D redesign"`.

### Task 2: Design system — `styles.css` rewrite

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes: Task 1 markup/classes.
- Produces: CSS custom props (`--bg, --ink, --accent, --accent2, --glass...`), `.panel` glass styles, `.reveal`/`.is-in` animation contract for script.js, `html.no-webgl body` gradient fallback, `@media (prefers-reduced-motion)` disabling reveal transforms.

- [ ] **Step 1:** Write the dark design system: near-black `#050508` base, spectral accent gradient (electric blue → violet), display/body type scale (clamp-based), glass panels (translucent bg + backdrop-filter + 1px borders), slim left progress nav with active states, hero with treated photo (masked/blended into scene), responsive ≤900px collapses to burger nav, reduced-motion and no-webgl fallbacks.
- [ ] **Step 2:** Verify in Chrome at 1440px and 390px: layout holds, text legible over dark, no horizontal scroll.
- [ ] **Step 3:** Commit: `git commit -m "New dark cinematic design system"`.

### Task 3: UI behavior — `script.js` rewrite

**Files:**
- Modify: `script.js`

**Interfaces:**
- Consumes: Task 1 nav/burger ids, `.reveal` elements.
- Produces: IntersectionObserver adding `.is-in` to `.reveal`; scroll-spy toggling `.active` on `.nav-link` via `data-s`; burger open/close with `aria-expanded`; footer year; adds `no-webgl` class to `<html>` if `!window.WebGLRenderingContext`.

- [ ] **Step 1:** Implement the above, plus a scroll-progress indicator (thin bar or nav fill) driven by `scrollY / (scrollHeight - innerHeight)`.
- [ ] **Step 2:** Verify: reveals fire once per section, nav highlights while scrolling, burger works at 390px, zero console errors.
- [ ] **Step 3:** Commit: `git commit -m "UI interactions for redesign"`.

### Task 4: The 3D world — `scene.js`

**Files:**
- Create: `scene.js`

**Interfaces:**
- Consumes: `<canvas id="scene">`, import map `three` / `three/addons/`.
- Produces: self-initializing module; on any failure adds `no-webgl` to `<html>` and removes the canvas.

Core structure:

```js
// quality tiers
const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
const reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COUNT = isMobile ? 12000 : 45000;

// per-particle attributes: aSeed(float), aChaos(vec3) — plus formation targets
// aF0..aF4 packed as 5 vec3 attributes (formations computed in JS at init)
// vertex shader: pos = mix(chaosField(aChaos, uTime, aSeed), formationMix, uOrder)
// where formationMix blends aF[i] → aF[i+1] by journey segment uniforms
```

- Formations generated procedurally at init: (0) curl-ish noise cloud, (1) sphere-shell halo, (2) three gaussian clusters, (3) flowing ribbon along a curve, (4) cubic lattice.
- Journey: `p` from scroll, smoothed with damping (`cur += (target-cur)*0.04`); camera positioned along a CatmullRom spline `spline.getPoint(pSmooth)`, lookAt drifts ahead on the spline.
- Motion blur: `AfterimagePass.uniforms.damp` mapped from camera velocity (`clamp(0.75 + vel*k, 0.75, 0.96)`) so fast scrolling leaves trails, rest resolves crisp.
- Bloom: UnrealBloomPass, subtle threshold, strength ~0.9.
- Ordered-stage lines: `LineSegments` between lattice/cluster neighbors, opacity ∝ order.
- Reduced-motion tier: static camera, slow uTime drift only, no afterimage.
- Resize handler, pixel ratio `min(devicePixelRatio, 2)` (1.5 mobile), `document.hidden` pauses loop.
- Whole init in try/catch → fallback class.

- [ ] **Step 1:** Implement scene.js per above.
- [ ] **Step 2:** Verify in Chrome: particles render, scrolling flies the camera, formations morph in the right order, motion blur visible during fast scroll, zero console errors.
- [ ] **Step 3:** Commit: `git commit -m "3D particle universe with scroll camera and motion blur"`.

### Task 5: Verification & polish pass

**Files:**
- Modify: any of the four, as screenshots dictate.

- [ ] **Step 1:** Chrome DevTools MCP sweep: screenshot each journey stage at 1440px; performance trace while scrolling (no long-frame pileups); 390px emulation screenshots; reduced-motion emulation; console clean.
- [ ] **Step 2:** Iterate on composition/color/timing until the hero and transitions genuinely land (frontend-design skill guidance applies here).
- [ ] **Step 3:** Lighthouse quick check — SEO and accessibility not regressed vs. old site.
- [ ] **Step 4:** Final commit: `git commit -m "Polish 3D redesign after visual verification"`.
