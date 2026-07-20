# 3D Data Universe Redesign — Design Spec

**Date:** 2026-07-20
**Project:** ahmadpurweb (sahmadpur.github.io) — personal portfolio of Sohrab S. Ahmadpur
**Goal:** Full visual reimagining with a cinematic 3D experience that makes visitors say "wow", while keeping all existing content and SEO intact.

## Concept: "Complexity → Clarity"

One fullscreen WebGL canvas lives behind the entire page. The visitor lands inside a dark
nebula of glowing particles in chaotic motion. As they scroll, the camera flies through the
universe with motion-blur light trails, and the chaos progressively organizes — performing
the site's tagline: turning business complexity into strategic clarity.

Journey stages (mapped to scroll position / sections):

| Stage | Section | Particle formation |
|---|---|---|
| 0 | Hero | Chaotic curl-noise nebula, slow swirl |
| 1 | Who I Am | Particles gather into a loose halo/orbit |
| 2 | What I Do | Three distinct clusters (mirroring the three service cards) |
| 3 | My Story / Impact | An ordered flowing stream / timeline ribbon |
| 4 | Let's Talk | Calm, perfect lattice grid — full clarity |

Faint connecting lines appear between near particles in the ordered stages.

## Aesthetic

- **Dark cinematic:** near-black background (#050508-ish), glowing particles, dramatic bloom.
- Accent palette: cool spectral glow (electric blue → violet → warm highlight accent).
- Big editorial typography: display face for headlines + clean sans for body (Google Fonts,
  no build step). Replaces Albert Sans.
- Content sections float over the canvas as dark glass panels (backdrop blur, thin borders).
- Photo stays in the hero, treated to sit naturally in the dark scene.
- Slim fixed progress navigation (replaces the current sidebar); mobile keeps burger overlay.

## Architecture

Static site, no build step, GitHub Pages compatible.

- `index.html` — restructured content layer; same semantic sections, copy, JSON-LD, and meta preserved.
- `styles.css` — new dark design system (rewritten).
- `script.js` — UI: nav, mobile menu, scroll progress, reveal observers.
- `scene.js` — the 3D world (ES module). Three.js pinned via CDN import map
  (unpkg/jsdelivr), plus postprocessing passes from `three/addons`.

### 3D scene internals

- **Particles:** single `THREE.Points` with custom ShaderMaterial, ~30–50k particles desktop.
  Each particle has attributes: seed, chaos-position (curl-noise field evaluated in the vertex
  shader over time), and per-stage target positions. A global `uProgress` (scroll journey
  position) blends chaotic motion → stage formations.
- **Lines:** sparse `THREE.LineSegments` between neighbor particles in ordered formations,
  opacity keyed to journey progress.
- **Camera:** scroll progress (0–1 across the document) drives a point along a hand-tuned
  spline path; heavy damping (lerp) creates real velocity between target and actual position.
- **Motion blur:** EffectComposer with UnrealBloomPass (glow) + AfterimagePass whose damp
  factor is modulated by camera velocity — fast scrolls smear particles into light trails,
  stopping resolves the scene crisply.
- **Scroll sync:** normalized scroll drives `uProgress` and camera; content reveal animations
  trigger via IntersectionObserver, independent of the 3D loop.

## Performance & fallbacks

- Pixel ratio capped at 2 (1.5 on weaker GPUs); particle count scaled by device
  (heuristic: pointer/touch + screen size + `hardwareConcurrency`).
- Mobile: reduced particle count, cheaper or disabled afterimage pass.
- `prefers-reduced-motion`: static gently-drifting field, no camera flight, no blur.
- No WebGL: canvas removed, pure CSS gradient background; page fully usable.
- Scene initialized after first paint; fonts preconnected; content never blocked by 3D.

## Error handling

- Scene init wrapped in try/catch → falls back to CSS background on any failure.
- CDN load failure of Three.js → same fallback (module import error caught via dynamic import).

## Testing / verification

- Serve locally, verify in Chrome via DevTools MCP: zero console errors, screenshots of every
  journey stage, performance trace during scroll (target ~60fps desktop), mobile emulation
  (390px), reduced-motion check, WebGL-disabled fallback sanity check.
- Lighthouse: keep SEO/accessibility scores from regressing.

## Out of scope

- No CMS, no build tooling, no frameworks, no content rewrites, no new pages.
