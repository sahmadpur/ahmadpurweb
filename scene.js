/* ============================================================
   SOHRAB AHMADPUR — scene.js
   The data universe: 5-stage particle journey (chaos → order),
   scroll-driven camera flight with velocity motion blur.
   ============================================================ */

(async () => {
  const root = document.documentElement;
  const canvas = document.getElementById('scene');

  const fail = () => {
    root.classList.add('no-webgl');
    if (canvas) canvas.remove();
  };

  if (!canvas || root.classList.contains('no-webgl')) { fail(); return; }

  try {
    const THREE = await import('three');
    const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
    const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
    const { AfterimagePass } = await import('three/addons/postprocessing/AfterimagePass.js');
    const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');

    /* ── Quality tiers ─────────────────────────────── */
    const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COUNT = isMobile ? 14000 : 45000;
    const PR = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2);

    /* ── Renderer / scene / camera ─────────────────── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(PR);
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x04050a, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04050a, 0.016);

    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
    camera.position.set(0, 0, 30);

    /* ── Formations ────────────────────────────────── */
    const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.75;

    const F = [];
    for (let i = 0; i < 5; i++) F.push(new Float32Array(COUNT * 3));

    // 0 — chaotic nebula: billowing gaussian cloud
    for (let i = 0; i < COUNT; i++) {
      F[0][i * 3 + 0] = gauss() * 9;
      F[0][i * 3 + 1] = gauss() * 5.5;
      F[0][i * 3 + 2] = gauss() * 9;
    }

    // 1 — orbital halo: sphere shell + equatorial ring
    for (let i = 0; i < COUNT; i++) {
      if (i % 4 === 0) {
        const a = Math.random() * Math.PI * 2;
        const r = 10.5 + gauss() * 0.35;
        F[1][i * 3 + 0] = Math.cos(a) * r;
        F[1][i * 3 + 1] = gauss() * 0.3;
        F[1][i * 3 + 2] = Math.sin(a) * r;
      } else {
        const u = Math.random() * 2 - 1;
        const t = Math.random() * Math.PI * 2;
        const r = 7.5 + gauss() * 0.5;
        const s = Math.sqrt(1 - u * u);
        F[1][i * 3 + 0] = s * Math.cos(t) * r;
        F[1][i * 3 + 1] = u * r;
        F[1][i * 3 + 2] = s * Math.sin(t) * r;
      }
    }

    // 2 — three clusters (the three practice areas)
    const centers = [[-8, 2, 0], [0, -1.5, 2.5], [8, 1.5, -1]];
    for (let i = 0; i < COUNT; i++) {
      const c = centers[i % 3];
      F[2][i * 3 + 0] = c[0] + gauss() * 2.4;
      F[2][i * 3 + 1] = c[1] + gauss() * 2.4;
      F[2][i * 3 + 2] = c[2] + gauss() * 2.4;
    }

    // 3 — timeline stream: flowing ribbon
    for (let i = 0; i < COUNT; i++) {
      const t = i / COUNT;
      F[3][i * 3 + 0] = (t - 0.5) * 30;
      F[3][i * 3 + 1] = Math.sin(t * Math.PI * 3) * 3.2 + gauss() * 0.7;
      F[3][i * 3 + 2] = Math.cos(t * Math.PI * 2) * 3.2 + gauss() * 0.7;
    }

    // 4 — clarity globe: dense latitude rings form a sphere of light
    const R4 = 8.5;
    const LAT = 26;
    {
      const weights = [];
      let wsum = 0;
      for (let j = 0; j < LAT; j++) {
        const w = Math.sin(Math.PI * (j + 0.5) / LAT);
        weights.push(w);
        wsum += w;
      }
      let i = 0;
      for (let j = 0; j < LAT && i < COUNT; j++) {
        const m = j === LAT - 1
          ? COUNT - i
          : Math.max(3, Math.round(COUNT * weights[j] / wsum));
        const th = Math.PI * (j + 0.5) / LAT;
        for (let k = 0; k < m && i < COUNT; k++, i++) {
          const ph = (k / m) * Math.PI * 2;
          F[4][i * 3 + 0] = Math.sin(th) * Math.cos(ph) * R4;
          F[4][i * 3 + 1] = Math.cos(th) * R4;
          F[4][i * 3 + 2] = Math.sin(th) * Math.sin(ph) * R4;
        }
      }
    }

    /* ── Particle attributes ───────────────────────── */
    const seeds = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);
    const cBlue = new THREE.Color(0x5b8cff);
    const cViolet = new THREE.Color(0xa06bff);
    const cAmber = new THREE.Color(0xffb35c);
    const tmp = new THREE.Color();

    for (let i = 0; i < COUNT; i++) {
      seeds[i] = Math.random();
      if (Math.random() < 0.05) tmp.copy(cAmber);
      else tmp.copy(cBlue).lerp(cViolet, Math.random());
      colors[i * 3 + 0] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(F[0], 3)); // required by three; real pos from aF*
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    for (let i = 0; i < 5; i++) geo.setAttribute('aF' + i, new THREE.BufferAttribute(F[i], 3));

    const uniforms = {
      uTime: { value: 0 },
      uSeg: { value: 0 },
      uChaos: { value: 3.6 },
      uSize: { value: (isMobile ? 30 : 42) * PR }
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aSeed;
        attribute vec3 aColor;
        attribute vec3 aF0, aF1, aF2, aF3, aF4;
        uniform float uTime, uSeg, uChaos, uSize;
        varying vec3 vColor;
        varying float vFade;

        void main() {
          vec3 t = aF0;
          t = mix(t, aF1, smoothstep(0.0, 1.0, uSeg));
          t = mix(t, aF2, smoothstep(1.0, 2.0, uSeg));
          t = mix(t, aF3, smoothstep(2.0, 3.0, uSeg));
          t = mix(t, aF4, smoothstep(3.0, 4.0, uSeg));

          float s = aSeed * 6.2831;
          vec3 wob = vec3(
            sin(t.y * 0.35 + uTime * 0.42 + s * 3.0),
            sin(t.z * 0.32 + uTime * 0.36 + s * 5.0),
            sin(t.x * 0.30 + uTime * 0.40 + s * 7.0)
          );
          t += wob * uChaos * (0.6 + aSeed * 1.6);

          vec4 mv = modelViewMatrix * vec4(t, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = max(0.001, -mv.z);
          gl_PointSize = clamp(uSize * (0.35 + aSeed * 0.85) / dist, 1.0, 14.0);

          vColor = aColor;
          vFade = smoothstep(90.0, 20.0, dist);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vColor;
        varying float vFade;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float a = smoothstep(0.5, 0.04, d);
          a *= a;
          if (a < 0.02) discard;
          gl_FragColor = vec4(vColor * (0.7 + a * 0.8), a * 0.5 * vFade);
        }
      `
    });

    const universe = new THREE.Group();
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    universe.add(points);

    /* Meridian lines cross the globe's rings — visible only at full clarity */
    const MER = isMobile ? 12 : 20;
    const MSEG = isMobile ? 36 : 48;
    const lineCount = MER * MSEG;
    const linePos = new Float32Array(lineCount * 6);
    {
      let li = 0;
      for (let m = 0; m < MER; m++) {
        const ph = (m / MER) * Math.PI * 2;
        for (let s = 0; s < MSEG; s++, li++) {
          const t0 = Math.PI * s / MSEG;
          const t1 = Math.PI * (s + 1) / MSEG;
          linePos[li * 6 + 0] = Math.sin(t0) * Math.cos(ph) * R4;
          linePos[li * 6 + 1] = Math.cos(t0) * R4;
          linePos[li * 6 + 2] = Math.sin(t0) * Math.sin(ph) * R4;
          linePos[li * 6 + 3] = Math.sin(t1) * Math.cos(ph) * R4;
          linePos[li * 6 + 4] = Math.cos(t1) * R4;
          linePos[li * 6 + 5] = Math.sin(t1) * Math.sin(ph) * R4;
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x6f8fff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    lines.frustumCulled = false;
    universe.add(lines);

    /* Distant static starfield for depth */
    const starCount = isMobile ? 600 : 1600;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const r = 70 + Math.random() * 80;
      const s = Math.sqrt(1 - u * u);
      starPos[i * 3 + 0] = s * Math.cos(t) * r;
      starPos[i * 3 + 1] = u * r;
      starPos[i * 3 + 2] = s * Math.sin(t) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x8b98c9, size: 0.35, sizeAttenuation: true,
      transparent: true, opacity: 0.55, depthWrite: false
    }));
    scene.add(stars);
    scene.add(universe);

    /* ── Post-processing: bloom + velocity motion blur ─ */
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(PR);
    composer.addPass(new RenderPass(scene, camera));

    let afterimage = null;
    if (!reduced) {
      afterimage = new AfterimagePass(0.45);
      composer.addPass(afterimage);
    }

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(innerWidth, innerHeight),
      isMobile ? 0.6 : 0.85, 0.7, 0.06
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    /* ── Camera flight path ────────────────────────── */
    const spline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 30),
      new THREE.Vector3(15, 5, 18),
      new THREE.Vector3(-19, -5, 8),
      new THREE.Vector3(-9, 9, -24),
      new THREE.Vector3(17, 4, -20),
      new THREE.Vector3(0, 14, 22)
    ], false, 'catmullrom', 0.35);

    /* Journey mapping: page scroll → segment 0..4 */
    const anchors = [0, 0.22, 0.45, 0.70, 1.0];
    const chaosLevels = [3.6, 1.5, 0.75, 0.35, 0.015];

    const piecewise = (p, values) => {
      for (let i = 0; i < anchors.length - 1; i++) {
        if (p <= anchors[i + 1]) {
          const f = (p - anchors[i]) / (anchors[i + 1] - anchors[i]);
          return values[i] + (values[i + 1] - values[i]) * f;
        }
      }
      return values[values.length - 1];
    };
    const segLevels = [0, 1, 2, 3, 4];

    /* ── State ─────────────────────────────────────── */
    let targetP = 0, smoothP = 0;
    let pointerX = 0, pointerY = 0, smX = 0, smY = 0;
    const prevCam = camera.position.clone();
    let paused = false;

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      targetP = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    };
    addEventListener('scroll', readScroll, { passive: true });
    readScroll();

    if (!isMobile) {
      addEventListener('pointermove', (e) => {
        pointerX = (e.clientX / innerWidth - 0.5) * 2;
        pointerY = (e.clientY / innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      composer.setSize(innerWidth, innerHeight);
    });

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      if (!paused) { clock.getDelta(); loop(); }
    });

    /* ── Main loop ─────────────────────────────────── */
    const clock = new THREE.Clock();
    const look = new THREE.Vector3();

    function loop() {
      if (paused) return;
      requestAnimationFrame(loop);

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const k = 1 - Math.pow(0.001, dt); // framerate-independent damping (~0.066 @60fps)

      smoothP += (targetP - smoothP) * k;
      smX += (pointerX - smX) * k * 0.6;
      smY += (pointerY - smY) * k * 0.6;

      uniforms.uTime.value = reduced ? t * 0.25 : t;
      uniforms.uSeg.value = piecewise(smoothP, segLevels);
      uniforms.uChaos.value = piecewise(smoothP, chaosLevels);

      lineMat.opacity = Math.max(0, (uniforms.uSeg.value - 3.25) / 0.75) * 0.3;

      universe.rotation.y = t * 0.015 + smoothP * 0.9;

      if (reduced) {
        camera.position.set(smX * 1.5, -smY * 1.0, 27);
        camera.lookAt(0, 0, 0);
      } else {
        spline.getPoint(smoothP, camera.position);
        camera.position.x += smX * 1.4;
        camera.position.y += -smY * 1.0;
        look.set(smX * 3, -smY * 2, 0);
        camera.lookAt(look);

        // motion blur strength follows real camera velocity
        if (afterimage) {
          const vel = camera.position.distanceTo(prevCam) / Math.max(dt, 0.008);
          const damp = Math.min(0.93, 0.42 + vel * 0.022);
          afterimage.uniforms.damp.value = damp;
        }
        prevCam.copy(camera.position);
      }

      composer.render();
    }

    loop();

  } catch (e) {
    fail();
  }
})();
