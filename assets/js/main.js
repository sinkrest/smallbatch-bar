/* ==========================================================================
   SMALL BATCH – Nexø Havn
   Vanilla JS + GSAP/ScrollTrigger + Lenis (vendored). No build step.
   Performance rules: the hero (beer + logo cut-out + glow) is ONE WebGL pass;
   everything else animates transform/opacity only, and every per-frame job
   sleeps while its section is off screen.
   ========================================================================== */
(() => {
  'use strict';

  const C = window.SB_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const isSmall = () => innerWidth <= 760;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  const NO = '<span class="no">N<span>o</span></span>';   // the club's Nº (fonts have no U+2116)

  let lang = 'da';
  let motionPaused = store.get('sb-motion') === 'off';
  let lenis = null;
  const T = (da, en) => (lang === 'en' ? en : da);
  const L = (o) => (o && typeof o === 'object' ? (o[lang] ?? o.da) : o);

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- one frame loop; jobs return nothing and gate themselves ---------- */
  const tickers = new Set();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(64, now - last) / 1000; last = now;
    tickers.forEach((fn) => fn(now / 1000, dt));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const whileVisible = (el, cb, margin = '0px') => {
    const io = new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
  };

  /* ======================================================================
     I18N – Danish in the markup, English in data-en
     ====================================================================== */
  const I18N_ATTRS = ['placeholder', 'aria-label', 'alt'];
  const CURSOR_LABELS = { Skål: 'Cheers', Klub: 'Club', Pause: 'Pause', Play: 'Play', Skænk: 'Pour' };
  const renderers = [];

  function initI18n() {
    $$('[data-en]').forEach((el) => { if (!el.hasAttribute('data-da')) el.dataset.da = el.innerHTML; });
    I18N_ATTRS.forEach((a) => $$(`[data-en-${a}]`).forEach((el) => {
      if (!el.hasAttribute(`data-da-${a}`)) el.setAttribute(`data-da-${a}`, el.getAttribute(a) || '');
    }));
    $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    const saved = store.get('sb-lang');
    const nav = (navigator.language || 'da').toLowerCase();
    setLang(saved || (/^(da|nb|no|nn)/.test(nav) ? 'da' : 'en'), true);
  }

  function setLang(l, initial) {
    lang = l === 'en' ? 'en' : 'da';
    document.documentElement.lang = lang;
    store.set('sb-lang', lang);
    $$('[data-en]').forEach((el) => { const v = lang === 'en' ? el.dataset.en : el.dataset.da; if (el.innerHTML !== v) el.innerHTML = v; });
    I18N_ATTRS.forEach((a) => $$(`[data-en-${a}]`).forEach((el) => el.setAttribute(a, el.getAttribute(lang === 'en' ? `data-en-${a}` : `data-da-${a}`))));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('.pint-tip').textContent = T('Skål!', 'Cheers!');
    renderers.forEach((fn) => fn(initial));
    if (!initial && hasGSAP) requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  /* links into the club concept, per language */
  function clubHref(anchor = '') { const u = C.clubUrl || {}; return (u[lang] || u.da || '#club') + (anchor || ''); }
  renderers.push(() => $$('[data-club-link]').forEach((a) => { a.href = clubHref(a.dataset.clubLink); }));

  /* ======================================================================
     UTILITIES – toast, bubble burst, scramble
     ====================================================================== */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  const burst = (() => {
    const cv = $('#burst'); const ctx = cv.getContext('2d');
    let parts = [], running = false, prev = 0;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
    size(); addEventListener('resize', size);
    function step(now) {
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0.016; prev = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0);
      parts.forEach((p) => {
        p.vy -= 260 * dt; p.vx *= 0.985; p.x += p.vx * dt + Math.sin(p.life * 8 + p.seed) * 0.6; p.y += p.vy * dt; p.life -= dt / p.ttl;
        const a = clamp(p.life * 1.4, 0, 1);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${(150 + p.seed * 60) | 0},40,${a * 0.18})`; ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = `rgba(255,236,200,${a * 0.85})`; ctx.stroke();
      });
      if (parts.length) requestAnimationFrame(step); else { running = false; prev = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    return (x, y, n = 40) => {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 260;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 120, r: 3 + Math.random() * 10, life: 1, ttl: 1 + Math.random() * 1.2, seed: Math.random() });
      }
      if (!running) { running = true; requestAnimationFrame(step); }
    };
  })();

  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ0123456789';
  function scramble(el, finalText, dur = 0.9) {
    if (reduced) { el.textContent = finalText; return; }
    const start = performance.now(); const chars = [...finalText];
    const reveal = chars.map((_, i) => (i / chars.length) * 0.7 + Math.random() * 0.3);
    (function step(now) {
      const p = clamp((now - start) / (dur * 1000), 0, 1);
      el.textContent = chars.map((ch, i) => (ch === ' ' || p >= reveal[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (p < 1) requestAnimationFrame(step); else el.textContent = finalText;
    })(start);
  }
  function onVisible(el, fn, opts = { threshold: 0.2 }) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), opts);
    io.observe(el); return io;
  }

  /* ======================================================================
     HOURS / STATUS – hours are not published, so say nothing about them
     ====================================================================== */
  const hours = C.hours || {};
  const hoursKnown = Object.values(hours).some(Boolean);
  const DAYS = { da: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
  function renderStatus() {
    $('#status').className = 'status is-info';
    $('#statusText').textContent = T('20 haner · Nexø Havn', '20 taps · Nexø Havn');
  }
  function renderHours() {
    const box = $('#hours');
    if (!hoursKnown) {
      box.className = 'hours-follow';
      box.innerHTML = T(`Følg <a href="${C.social.instagram}" target="_blank" rel="noopener">@smallbatchnexo</a> for nyt fra baren.`, `Follow <a href="${C.social.instagram}" target="_blank" rel="noopener">@smallbatchnexo</a> for news from the bar.`);
      return;
    }
    box.className = 'hours';
    const today = new Date().getDay();
    box.innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="hours-row${d === today ? ' is-today' : ''}"><span>${DAYS[lang][d]}</span><span>${hours[d] ? `${hours[d][0]} – ${hours[d][1]}` : T('Lukket', 'Closed')}</span></div>`).join('');
  }
  renderers.push(renderStatus, renderHours);

  /* ======================================================================
     CURSOR · MAGNETIC · NAV · PINT · MOTION TOGGLE
     ====================================================================== */
  function initCursor() {
    if (!fine || reduced) return;
    document.documentElement.classList.add('has-cursor');
    const cur = $('#cursor'), ring = $('.cursor-ring', cur), dot = $('.cursor-dot', cur), label = $('span', ring);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, moving = false;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate3d(${mx}px,${my}px,0)`; moving = true; }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor-label]');
      const hov = e.target.closest('a, button, [role="button"], label, #tapBoard .tap, .mcard');
      if (lab) { const t = lab.dataset.cursorLabel; label.textContent = lang === 'en' ? (CURSOR_LABELS[t] || t) : t; cur.classList.add('is-label'); cur.classList.remove('is-hover'); }
      else { cur.classList.remove('is-label'); cur.classList.toggle('is-hover', !!hov); }
    });
    document.addEventListener('pointerleave', () => { cur.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { cur.style.opacity = '1'; });
    tickers.add(() => {
      if (!moving) return;
      rx = lerp(rx, mx, 0.2); ry = lerp(ry, my, 0.2);
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
      if (Math.abs(rx - mx) < 0.1 && Math.abs(ry - my) < 0.1) moving = false;
    });
  }

  function initMagnetic() {
    if (!fine || reduced || !hasGSAP) return;
    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.28); yTo((e.clientY - r.top - r.height / 2) * 0.32); });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  function scrollToTarget(hash) {
    if (hash === '#top' || hash === '#') { lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
    const el = document.querySelector(hash); if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
    else scrollTo({ top: el.getBoundingClientRect().top + scrollY - 70, behavior: reduced ? 'auto' : 'smooth' });
  }

  function initNav() {
    const header = $('#header'), burger = $('#burger'), menu = $('#menu');
    let lastY = 0, ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY; ticking = false;
        header.classList.toggle('is-solid', y > 60);
        if (!document.body.classList.contains('is-locked')) header.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
        lastY = y;
      });
    }, { passive: true });
    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute('href');
      if (hash === '#main') return;
      e.preventDefault(); setMenu(false); scrollToTarget(hash);
    });
  }

  function initPint() {
    const pint = $('#pint'), beer = $('#pintBeer'), foam = $('#pintFoam');
    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
      const top = 62 - p * 58;
      beer.setAttribute('y', top.toFixed(1)); foam.setAttribute('y', (top - 3.5).toFixed(1)); foam.setAttribute('height', p > 0.02 ? '4.5' : '0');
      pint.classList.toggle('is-on', scrollY > 300); pint.classList.toggle('is-full', p > 0.985);
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function initMotionToggle() {
    const btn = $('#motionToggle'), txt = $('.txt', btn);
    const apply = () => {
      document.documentElement.classList.toggle('motion-paused', motionPaused);
      btn.setAttribute('aria-pressed', String(motionPaused));
      txt.textContent = motionPaused ? T('Start bevægelse', 'Play motion') : T('Pause bevægelse', 'Pause motion');
    };
    btn.addEventListener('click', () => { motionPaused = !motionPaused; store.set('sb-motion', motionPaused ? 'off' : 'on'); apply(); });
    renderers.push(apply);
  }

  /* ======================================================================
     HERO – one WebGL pass: beer texture (or Higgsfield video), rising
     bubbles, cursor ripple, and the SMALL BATCH cut-out from a signed
     distance field (crisp at any zoom, nothing for the DOM to repaint)
     ====================================================================== */
  const LOGO_W = 1010, LOGO_H = 665;
  const SDF = { pad: 48, w: 1106, h: 761, range: 40 };
  const heroState = { zoom: 0, fade: 1, veil: 1, glow: 1, logo: [0, 0, 1], active: true, gl: false, dirty: true };

  function pickHeroVideo() {
    const v = (C.videos && C.videos.hero) || {};
    if (v.byTime) {
      const h = new Date().getHours();
      const slot = h < 10 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'dusk' : 'night';
      if (v.byTime[slot]) return v.byTime[slot];
    }
    if (isSmall() && v.srcMobile) return v.srcMobile;
    return v.src || '';
  }

  function initHeroGL() {
    const canvas = $('#heroGL'), hero = $('#top');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return false;

    const vs = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const fs = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex, uSdf;
      uniform vec2 uRes, uImg, uMouse;
      uniform vec3 uLogo;
      uniform float uTime, uVel, uZoom, uFade, uVeil, uGlow, uDpr;
      float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x), u.y); }
      vec2 cover(vec2 uv){ float rs=uRes.x/uRes.y, ri=uImg.x/uImg.y;
        vec2 s = rs>ri ? vec2(1., ri/rs) : vec2(rs/ri, 1.); return (uv-.5)*s+.5; }
      vec4 bubbles(vec2 p, float scale, float speed, float seed){
        p*=scale; p.y-=uTime*speed;
        vec2 id=floor(p); vec2 gv=fract(p)-.5;
        float h=hash(id+seed);
        if(h<.5) return vec4(0.);
        vec2 off=(vec2(hash(id+seed+3.),hash(id+seed+9.))-.5)*.4;
        off.x+=sin(uTime*1.6+h*31.)*.06;
        float r=mix(.07,.2,hash(id+seed+17.));
        vec2 q=gv-off; float d=length(q);
        float inside=smoothstep(r,r-.02,d);
        float rim=smoothstep(r-.06,r-.008,d)*inside;
        float spec=smoothstep(r*.32,0.,length(q+vec2(r*.38,-r*.38)))*inside;
        return vec4(q*inside, rim, spec);
      }
      void main(){
        vec2 asp=vec2(uRes.x/uRes.y,1.);
        vec2 uv=(vUv-.5)/(1.+uZoom*.35)+.5;
        float t=uTime*.05;
        uv+=(vec2(noise(uv*3.+vec2(t,-t*1.3)), noise(uv*3.+vec2(-t*.7,t)+7.))-.5)*.014;
        vec2 m=uMouse; vec2 d=(uv-m)*asp; float dist=length(d);
        uv+=normalize(d+1e-5)*sin(dist*36.-uTime*4.)*exp(-dist*7.)*(.0025+uVel*.03)/asp;
        float a=exp(-dist*dist*16.)*uVel*.9;
        vec2 rr=(uv-m)*asp; rr=mat2(cos(a),-sin(a),sin(a),cos(a))*rr; uv=m+rr/asp;
        vec4 b1=bubbles(vUv*asp,7.,.32,1.);
        vec4 b2=bubbles(vUv*asp+3.1,13.,.55,7.);
        uv+=(b1.xy*.02+b2.xy*.012)/asp;
        vec2 tuv=cover(uv);
        float ca=.0012+uVel*.006;
        vec3 col;
        col.r=texture2D(uTex,tuv+vec2(ca,0.)).r;
        col.g=texture2D(uTex,tuv).g;
        col.b=texture2D(uTex,tuv-vec2(ca,0.)).b;
        col+=(b1.z*.55+b2.z*.35)*vec3(1.,.86,.62);
        col+=(b1.w+b2.w*.7)*.9;
        col*=vec3(1.05,.98,.9);
        col+=vec3(1.,.42,.08)*exp(-dist*3.5)*.14;
        float v=smoothstep(1.3,.2,length((vUv-.5)*vec2(asp.x*.75,1.)));
        col*=mix(.4,1.,v);
        col*=uFade;
        // logo cut-out from the SDF (logo units; + inside)
        vec2 css=vec2(gl_FragCoord.x, uRes.y-gl_FragCoord.y)/uDpr;
        vec2 L=(css-uLogo.xy)/uLogo.z;
        vec2 suv=(L+${SDF.pad.toFixed(1)})/vec2(${SDF.w.toFixed(1)},${SDF.h.toFixed(1)});
        float sd=-${SDF.range.toFixed(1)};
        if(suv.x>0.&&suv.x<1.&&suv.y>0.&&suv.y<1.) sd=(texture2D(uSdf,suv).r-.5)*${(SDF.range * 2).toFixed(1)};
        float aa=.9/uLogo.z;
        float inL=smoothstep(-aa,aa,sd);
        float glow=exp(-max(-sd,0.)*uLogo.z/16.)*smoothstep(${(SDF.range * 0.9).toFixed(1)},0.,-sd)*(1.-inL);
        vec3 veil=vec3(.067,.055,.043)+vec3(1.,.4,.08)*glow*.28*uGlow;
        col=mix(col,veil,(1.-inL)*uVeil);
        gl_FragColor=vec4(col,1.);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return false;
    const prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uTex', 'uSdf', 'uRes', 'uImg', 'uMouse', 'uLogo', 'uTime', 'uVel', 'uZoom', 'uFade', 'uVeil', 'uGlow', 'uDpr'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

    const makeTex = (unit) => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    };
    const tex = makeTex(0), sdfTex = makeTex(1);
    let imgW = 16, imgH = 9, beerReady = false, sdfReady = false, video = null;

    const upload = (unit, t, src, flip, fmt) => {
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
      gl.texImage2D(gl.TEXTURE_2D, 0, fmt, fmt, gl.UNSIGNED_BYTE, src);
    };

    // beer still – downscaled once so the GPU samples a sane texture
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const maxW = isSmall() ? 1200 : 1920;
      let src = img;
      if (img.naturalWidth > maxW) {
        const c = document.createElement('canvas');
        c.width = maxW; c.height = Math.round(img.naturalHeight * maxW / img.naturalWidth);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); src = c;
      }
      upload(0, tex, src, true, gl.RGB);
      imgW = src.width || img.naturalWidth; imgH = src.height || img.naturalHeight; beerReady = true; heroState.dirty = true;
    };
    img.src = $('.hero-fallback').currentSrc || $('.hero-fallback').src;

    const sdfImg = new Image();
    sdfImg.onload = () => { upload(1, sdfTex, sdfImg, false, gl.LUMINANCE); sdfReady = true; heroState.dirty = true; };
    sdfImg.src = 'assets/img/logo-sdf.png';

    const vsrc = !reduced && pickHeroVideo();
    if (vsrc) {
      video = document.createElement('video');
      Object.assign(video, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', src: vsrc });
      video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
      video.play().catch(() => { /* low-power mode: stay on the still */ });
    }

    let dpr = 1;
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      const budget = isSmall() ? 1.1e6 : 2.4e6;               // pixel budget per frame
      if (w * h * dpr * dpr > budget) dpr = Math.sqrt(budget / (w * h));
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height); heroState.dirty = true;
    }
    resize(); addEventListener('resize', resize);

    let tx = 0.5, ty = 0.5, px = 0.5, py = 0.5, hasPointer = false;
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width; ty = 1 - (e.clientY - r.top) / r.height; hasPointer = true;
    }, { passive: true });
    whileVisible(hero, (on) => { heroState.active = on; if (video) on ? video.play().catch(() => {}) : video.pause(); });

    let time = 0, vel = 0;
    tickers.add((t, dt) => {
      if (!heroState.active || !sdfReady || (!beerReady && !video)) return;
      const animate = !motionPaused && !reduced;
      if (animate) time += dt;
      if (!hasPointer && animate) { tx = 0.5 + Math.sin(time * 0.35) * 0.22; ty = 0.5 + Math.cos(time * 0.27) * 0.18; }
      const nx = lerp(px, tx, 0.08), ny = lerp(py, ty, 0.08);
      vel = lerp(vel, clamp(Math.hypot(nx - px, ny - py) / Math.max(dt, 0.001) * 0.35, 0, 1), 0.08);
      const moved = Math.abs(nx - px) + Math.abs(ny - py) > 1e-5;
      px = nx; py = ny;
      if (video && video.readyState >= 2) { upload(0, tex, video, true, gl.RGB); imgW = video.videoWidth; imgH = video.videoHeight; beerReady = true; heroState.dirty = true; }
      if (!animate && !moved && !heroState.dirty) return;      // nothing changed: skip the frame
      heroState.dirty = false;
      if (!heroState.gl) { heroState.gl = true; hero.classList.add('gl-on'); }
      gl.uniform1i(U.uTex, 0); gl.uniform1i(U.uSdf, 1);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform2f(U.uImg, imgW, imgH);
      gl.uniform2f(U.uMouse, px, py);
      gl.uniform3f(U.uLogo, heroState.logo[0], heroState.logo[1], heroState.logo[2]);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uVel, reduced ? 0 : vel);
      gl.uniform1f(U.uZoom, heroState.zoom);
      gl.uniform1f(U.uFade, heroState.fade);
      gl.uniform1f(U.uVeil, heroState.veil);
      gl.uniform1f(U.uGlow, heroState.glow);
      gl.uniform1f(U.uDpr, dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
    return true;
  }

  /* ======================================================================
     HERO – logo layout + zoom-through-the-letter scroll
     ====================================================================== */
  const logoDs = $$('#sb-logo path').map((p) => p.getAttribute('d'));
  function findFocal() {
    const ctx = document.createElement('canvas').getContext('2d');
    const P = new Path2D(); logoDs.forEach((d) => P.addPath(new Path2D(d)));
    const inside = (x, y) => ctx.isPointInPath(P, x, y);
    const cx = LOGO_W / 2, cy = LOGO_H / 2, cands = [];
    for (let y = 40; y < LOGO_H - 40; y += 7) for (let x = 40; x < LOGO_W - 40; x += 7) cands.push([x, y, Math.hypot((x - cx) * 0.8, y - cy)]);
    cands.sort((a, b) => a[2] - b[2]);
    for (const depth of [34, 28, 22, 16]) {
      for (const [x, y] of cands) {
        if (!inside(x, y)) continue;
        let ok = true;
        for (let a = 0; a < 16 && ok; a++) { const g = (a / 16) * Math.PI * 2; ok = inside(x + Math.cos(g) * depth, y + Math.sin(g) * depth); }
        if (ok) return { x, y, depth };
      }
    }
    return { x: cx, y: cy, depth: 10 };
  }

  function initHeroMask(glOn) {
    const svg = $('#heroMask'), groups = $$('.m-logo', svg), hero = $('#top');
    const focal = findFocal();
    const st = { z: 0, intro: 0 };
    let lay = null;
    function layout() {
      const W = hero.clientWidth || innerWidth, H = hero.clientHeight || innerHeight;
      if (!W || !H) return;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const lw = Math.min(W * (isSmall() ? 0.9 : 0.8), 1240, H * 0.58 * (LOGO_W / LOGO_H));
      const k0 = lw / LOGO_W;
      lay = { W, H, k0, x0: (W - lw) / 2, y0: (H - LOGO_H * k0) / 2 + H * 0.015, Z: (Math.hypot(W, H) / 2) / (focal.depth * k0) * 1.25 };
      apply();
    }
    function apply() {
      if (!lay) return;
      const { W, H, k0, x0, y0, Z } = lay;
      const k = k0 * lerp(1, Z, st.z) * (0.9 + 0.1 * st.intro);
      const e = st.z * st.z;
      const cx = lerp(x0 + focal.x * k0, W / 2, e), cy = lerp(y0 + focal.y * k0, H / 2, e);
      const tx = cx - focal.x * k, ty = cy - focal.y * k;
      if (!Number.isFinite(k) || !Number.isFinite(tx) || !Number.isFinite(ty)) return;
      heroState.logo = [tx, ty, k]; heroState.dirty = true;
      if (!heroState.gl) { const tr = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(5)})`; groups.forEach((g) => g.setAttribute('transform', tr)); }
    }
    layout(); addEventListener('resize', layout);
    if (hasGSAP) ScrollTrigger.addEventListener('refresh', layout);

    $$('#heroAfter .ln').forEach((ln) => { ln.innerHTML = [...ln.textContent].map((c) => (c === ' ' ? ' ' : `<span class="char">${c}</span>`)).join(''); });
    const showHeader = () => setTimeout(() => $('#header').classList.remove('is-hidden'), 300);

    if (!hasGSAP || reduced) { st.intro = 1; apply(); return { intro: () => { layout(); showHeader(); } }; }

    const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.5), scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
    tl.to(st, { z: 1, duration: 1, ease: 'power2.in', onUpdate: apply }, 0)
      .to('#heroUI', { autoAlpha: 0, y: -40, duration: 0.25, ease: 'none' }, 0)
      .to(heroState, { glow: 0, duration: 0.3, onUpdate: () => { heroState.dirty = true; } }, 0.05)
      .to(heroState, { zoom: 1, duration: 1.4, ease: 'none' }, 0)
      .set(heroState, { veil: 0 }, 0.995)
      .set(svg, { autoAlpha: 0 }, 0.995)
      .fromTo('#heroAfter .char', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.025, duration: 0.35, ease: 'back.out(2)' }, 0.98)
      .to(heroState, { fade: 0.55, duration: 0.4 }, 1.0)
      .to({}, { duration: 0.35 });
    return {
      intro() {
        layout();
        gsap.fromTo(st, { intro: 0 }, { intro: 1, duration: 1.8, ease: 'expo.out', onUpdate: apply });
        gsap.from('.hero-kicker > *', { yPercent: 120, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', delay: 0.2 });
        gsap.from('.hero-corner, .hero-scroll, .motion-toggle', { y: 30, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.35 });
        showHeader();
      }
    };
  }

  /* ======================================================================
     MARQUEES – velocity reactive, asleep off screen
     ====================================================================== */
  function initMarquees() {
    const words = ['No boring beer', 'Mindre KPI', 'Mere IPA', 'Nexø Havn', 'Small Batch Club', 'Small Batch'];
    const hop = '<svg viewBox="0 0 32 43" aria-hidden="true"><use href="#sb-hop"/></svg>';
    const tracks = $$('.marquee-track');
    tracks.forEach((t) => { const h = words.map((w) => `<span class="marquee-item">${w}${hop}</span>`).join(''); t.innerHTML = h + h + h; });
    if (reduced) return;
    let vel = 0, boost = 0;
    if (hasGSAP) ScrollTrigger.create({ onUpdate: (self) => { vel = clamp(self.getVelocity() / 900, -6, 6); } });
    const st = tracks.map((track) => ({ track, x: 0, dir: Number(track.dataset.marquee) || 1, w: 0, on: false }));
    const measure = () => st.forEach((s) => { s.w = s.track.scrollWidth / 3; });
    measure(); addEventListener('resize', measure); if (document.fonts) document.fonts.ready.then(measure);
    st.forEach((s) => whileVisible(s.track.parentElement, (on) => { s.on = on; }, '100px'));
    tickers.add((t, dt) => {
      boost = lerp(boost, vel, 0.08); vel *= 0.9;
      if (motionPaused) return;
      st.forEach((s) => {
        if (!s.on || !s.w) return;
        s.x -= (60 + Math.abs(boost) * 90) * s.dir * (boost < -0.2 ? -1 : 1) * dt;
        if (s.x <= -s.w) s.x += s.w; if (s.x > 0) s.x -= s.w;
        s.track.style.transform = `translate3d(${s.x.toFixed(1)}px,0,0) skewX(${clamp(-boost * 2.5, -10, 10).toFixed(2)}deg)`;
      });
    });
  }

  /* ======================================================================
     MANIFEST – scroll-scrubbed word reveal with photo pills
     ====================================================================== */
  const MANIFEST = {
    da: 'Styrken i at være [beer] lille, lokal [sign] og *anderledes.* Hvor kærligheden til det lille bryg [bar-pour] vinder over ideen om at maksimere bundlinjen. Lige præcis lille nok til at lægge mærke til alle de små ting, [sunset-drinks] der gør en *stor forskel.*',
    en: 'The strength of being [beer] small, local [sign] and *different.* Where love for the small brew [bar-pour] beats the idea of maximising the bottom line. Just small enough to notice all the little things [sunset-drinks] that make a *big difference.*'
  };
  let manifestTL = null;
  function renderManifest() {
    const el = $('#manifestText');
    let it = false;
    el.innerHTML = MANIFEST[lang].split(' ').map((tok) => {
      const m = tok.match(/^\[(.+)\]$/);
      if (m) return `<span class="pill" aria-hidden="true"><img src="assets/img/${m[1]}.avif" alt="" loading="lazy" decoding="async"></span>`;
      const open = tok.startsWith('*'), close = tok.endsWith('*'); if (open) it = true;
      const out = `<span class="w${it ? ' it' : ''}">${tok.replace(/\*/g, '')}</span>`; if (close) it = false; return out;
    }).join(' ');
    if (manifestTL) { manifestTL.scrollTrigger && manifestTL.scrollTrigger.kill(); manifestTL.kill(); manifestTL = null; }
    const items = $$('.w, .pill', el);
    if (!hasGSAP || reduced) { items.forEach((n) => { n.style.opacity = 1; n.style.transform = 'none'; }); return; }
    manifestTL = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.5 } });
    items.forEach((n, i) => manifestTL.to(n, n.classList.contains('pill') ? { opacity: 1, scale: 1, duration: 1.2, ease: 'back.out(2)' } : { opacity: 1, duration: 0.8 }, i * 0.5));
  }
  renderers.push(renderManifest);

  /* ======================================================================
     TAP BOARD – % vol. shown neutrally, light to dark
     ====================================================================== */
  const TAG = { core: ['Kerneøl', 'Core range'], award: ['Prisvinder', 'Award winner'], club: ['Small Batch Club', 'Small Batch Club'] };
  const fmtAbv = (v) => `${v.toFixed(1).replace('.', lang === 'da' ? ',' : '.')} % vol.`;
  let tapIO = null;
  function renderTaps() {
    const board = $('#tapBoard');
    board.innerHTML = (C.taps || []).map((b, i) => {
      const dark = parseInt(b.color.slice(1, 3), 16) < 80;
      const tag = TAG[b.tag] || TAG.core;
      return `<div class="tap${b.locked ? ' is-locked' : ''}" role="listitem" tabindex="0" style="--c:${b.color};--hc:${dark ? '#d8b98f' : b.color}" data-i="${i}" data-cursor-label="${b.locked ? 'Klub' : 'Skænk'}">
        <span class="tap-no">${String(i + 1).padStart(2, '0')}</span>
        <span class="tap-name" data-name="${b.name}">${b.name}</span>
        <span class="tap-style">${L(b.style)}<small>${L(b.notes)}</small></span>
        <span class="tap-abv">${b.locked ? '–' : fmtAbv(b.abv)}</span>
        <span class="tap-ibu"><span class="bar"><i style="--lvl:${b.locked ? 100 : clamp(b.ibu / 60, 0, 1) * 100}%"></i></span><span>${b.locked ? T('Kun medlemmer', 'Members only') : 'IBU ' + b.ibu}</span></span>
        <span class="tap-tag is-${b.tag || 'core'}">${lang === 'en' ? tag[1] : tag[0]}</span>
      </div>`;
    }).join('');
    if (tapIO) tapIO.disconnect();
    if (reduced) return;
    tapIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const row = e.target; tapIO.unobserve(row);
      const name = $('.tap-name', row), d = Number(row.dataset.i);
      setTimeout(() => scramble(name, name.dataset.name, 1), d * 90);
      if (hasGSAP) gsap.from($('.tap-ibu .bar i', row), { scaleX: 0, duration: 1.4, ease: 'expo.out', delay: d * 0.08 });
    }), { threshold: 0.4 });
    $$('.tap', board).forEach((r) => tapIO.observe(r));
  }
  renderers.push(renderTaps);

  function initTapGlass() {
    const board = $('#tapBoard');
    const toClub = (e) => { if (e.target.closest('.tap.is-locked')) scrollToTarget('#club'); };
    board.addEventListener('click', toClub);
    board.addEventListener('keydown', (e) => { if (e.key === 'Enter') toClub(e); });
    if (!fine || reduced || !hasGSAP) return;
    const glass = $('#tapGlass'), beer = $('#glassBeer'), foam = $('#glassFoam'), fill = $('#glassFill'), bub = $('#glassBubbles');
    const bubbles = Array.from({ length: 12 }, () => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', (1 + Math.random() * 2.4).toFixed(2)); bub.appendChild(c);
      return { el: c, x: 36 + Math.random() * 68, y: 60 + Math.random() * 130, s: 30 + Math.random() * 60, ph: Math.random() * 6 };
    });
    let mx = 0, my = 0, gx = 0, gy = 0, vx = 0, on = false, level = 0, target = 0, waveX = 0;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    board.addEventListener('pointerover', (e) => {
      const row = e.target.closest('.tap'); if (!row) return;
      const b = C.taps[Number(row.dataset.i)];
      const dark = parseInt(b.color.slice(1, 3), 16) < 80;
      beer.setAttribute('fill', b.color); foam.setAttribute('fill', dark ? '#d8b98f' : '#f6efe2');
      if (!on) { gx = mx + 90; gy = my - 20; level = 0; }
      on = true; target = 1; level = Math.min(level, 0.25);
      gsap.to(glass, { opacity: 1, duration: 0.4, overwrite: 'auto' });
    });
    board.addEventListener('pointerleave', () => { on = false; target = 0; gsap.to(glass, { opacity: 0, duration: 0.3, overwrite: 'auto' }); });
    tickers.add((t, dt) => {
      if (!on && level < 0.01) return;
      const nx = lerp(gx, mx + 90, 0.16), ny = lerp(gy, my - 20, 0.16);
      vx = lerp(vx, (nx - gx) / Math.max(dt, 0.001), 0.2); gx = nx; gy = ny;
      level = lerp(level, target, 0.06); waveX = (waveX + dt * 60) % 80;
      glass.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0) rotate(${clamp(vx * 0.012, -16, 16).toFixed(2)}deg) scale(${(0.7 + level * 0.3).toFixed(3)})`;
      fill.setAttribute('transform', `translate(0 ${((1 - level) * 150).toFixed(1)})`);
      beer.setAttribute('transform', `translate(${-waveX.toFixed(1)} ${(Math.sin(t * 3) * 2).toFixed(2)})`);
      foam.setAttribute('transform', `translate(${-waveX.toFixed(1)} ${(Math.sin(t * 3) * 2).toFixed(2)})`);
      const top = 40 + (1 - level) * 150;
      bubbles.forEach((b) => { b.y -= b.s * dt; if (b.y < top + 12) b.y = 190; b.el.setAttribute('cx', (b.x + Math.sin(t * 4 + b.ph) * 2).toFixed(1)); b.el.setAttribute('cy', b.y.toFixed(1)); });
    });
  }

  /* ======================================================================
     HARBOUR – pinned horizontal gallery
     ====================================================================== */
  function initHarbour() {
    if (!hasGSAP || reduced) return;
    gsap.matchMedia().add('(min-width: 761px)', () => {
      const track = $('#harbourTrack'), bar = $('#harbourBar');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#harbour', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; } }
      });
      $$('.shot', track).forEach((s) => gsap.fromTo($('img', s), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }));
      $$('.shot-word', track).forEach((w) => gsap.fromTo(w, { rotate: -6, yPercent: 10 }, { rotate: 4, yPercent: -10, ease: 'none', scrollTrigger: { trigger: w, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }));
      return () => gsap.set(track, { x: 0 });
    });
  }

  /* ======================================================================
     SMALL BATCH CLUB – spotlight, number → card / bottle / tee, tiers, year
     ====================================================================== */
  const club = C.club || { year: 2027, cap: 300, table: 30, tiers: [], evenings: [] };
  const pad3 = (n) => String(n).padStart(3, '0');
  const kr = (n) => n.toLocaleString(lang === 'da' ? 'da-DK' : 'en-GB');
  const MONTHS = { da: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
  const tierName = (id) => { const t = club.tiers.find((x) => x.id === id); return t ? L(t.name) : id; };

  function initClubLight() {
    const sec = $('#club'), light = $('#clubLight');
    if (reduced) { light.style.transform = `translate3d(${sec.clientWidth * 0.7}px, 300px, 0)`; return; }
    let on = false, pointer = false, tx = 0, ty = 0, x = 0, y = 0, secTop = 0;
    const measure = () => { secTop = sec.getBoundingClientRect().top + scrollY; };
    measure(); addEventListener('resize', measure); if (hasGSAP) ScrollTrigger.addEventListener('refresh', measure);
    whileVisible(sec, (v) => { on = v; if (v) measure(); });
    sec.addEventListener('pointermove', (e) => { const r = sec.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; pointer = true; }, { passive: true });
    sec.addEventListener('pointerleave', () => { pointer = false; });
    tickers.add((t) => {
      if (!on) return;
      if (!pointer && !motionPaused) { tx = sec.clientWidth * (0.55 + Math.sin(t * 0.35) * 0.3); ty = clamp(scrollY - secTop + innerHeight * (0.45 + Math.cos(t * 0.27) * 0.2), 200, sec.clientHeight - 200); }
      x = lerp(x, tx, 0.07); y = lerp(y, ty, 0.07);
      light.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
  }

  const card = { n: 47, name: '' };
  function renderClubCount() {
    const from = Math.min(...club.tiers.map((t) => t.price));
    $('#clubCount').innerHTML = T(`Klubåret ${club.year} · ${NO} 001–${pad3(club.cap)} · fra ${kr(from)} kr. · 18+`, `Club year ${club.year} · ${NO} 001–${pad3(club.cap)} · from ${kr(from)} kr. · 18+`);
  }
  function renderCard(animate) {
    const n = pad3(card.n), table = card.n <= club.table;
    const num = $('#mcardNum');
    if (num.textContent !== n) { num.textContent = n; if (animate && !reduced) { num.classList.remove('is-foil'); void num.offsetWidth; num.classList.add('is-foil'); } }
    $$('.js-num').forEach((el) => { el.textContent = n; });
    if (animate && !reduced) { const wb = $('#wbNum'); wb.classList.remove('is-burning'); void wb.offsetWidth; wb.classList.add('is-burning'); }
    $('#mcardName').textContent = card.name || T('Dit navn', 'Your name');
    $('#mcardTier').textContent = table ? tierName('bord') : tierName('medlem');
    $('#mcardYear').textContent = T(`Klubåret ${club.year}`, `Club year ${club.year}`);
    $('#mcard').classList.toggle('is-table', table);
    $('#cGoTxt').innerHTML = T(`Fortsæt med ${NO} ${n} ↗`, `Continue with ${NO} ${n} ↗`);
    const note = $('#cNote');
    note.classList.toggle('is-table', table);
    note.innerHTML = table
      ? T(`${NO} 001–030 er Bryggerens bord – 30 pladser ved bordet.`, `${NO} 001–030 is the Brewer's Table – 30 seats at the table.`)
      : T(`Vælg mellem ${NO} 001 og ${pad3(club.cap)}. ${NO} 001–030 er Bryggerens bord.`, `Choose from ${NO} 001 to ${pad3(club.cap)}. ${NO} 001–030 is the Brewer's Table.`);
  }

  function initClubCard() {
    const num = $('#cNum'), name = $('#cName'), mcard = $('#mcard'), inner = $('.mcard-in', mcard);
    const commit = (animate) => {
      const v = parseInt(num.value.replace(/\D/g, ''), 10);
      if (Number.isFinite(v) && v >= 1 && v <= club.cap) { card.n = v; num.value = pad3(v); renderCard(animate); }
      else { num.value = pad3(card.n); $('#cNote').innerHTML = T(`Vælg et nummer mellem ${NO} 001 og ${pad3(club.cap)}.`, `Pick a number from ${NO} 001 to ${pad3(club.cap)}.`); }
    };
    num.addEventListener('input', () => { num.value = num.value.replace(/\D/g, '').slice(0, 3); });
    num.addEventListener('change', () => commit(true));
    num.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(true); } });
    name.addEventListener('input', () => { card.name = name.value.trim(); $('#mcardName').textContent = card.name || T('Dit navn', 'Your name'); });
    // one calm roll – never a "random"/game association
    $('#cSuggest').addEventListener('click', () => {
      const target = club.table + 1 + Math.floor(Math.random() * (club.cap - club.table));
      if (reduced || !hasGSAP) { card.n = target; num.value = pad3(target); renderCard(true); return; }
      const o = { v: card.n };
      gsap.to(o, { v: target, duration: 0.9, ease: 'power3.out', onUpdate: () => { num.value = pad3(Math.round(o.v)); $('#mcardNum').textContent = pad3(Math.round(o.v)); }, onComplete: () => { card.n = target; renderCard(true); } });
    });
    if (fine && !reduced) {
      const art = $('.numcard-art');
      art.addEventListener('pointermove', (e) => {
        const r = mcard.getBoundingClientRect();
        const x = clamp((e.clientX - r.left) / r.width - 0.5, -0.8, 0.8), y = clamp((e.clientY - r.top) / r.height - 0.5, -0.8, 0.8);
        inner.style.setProperty('--rx', `${(-y * 14).toFixed(1)}deg`); inner.style.setProperty('--ry', `${(x * 18).toFixed(1)}deg`);
        inner.style.setProperty('--mx', `${(50 + x * 90).toFixed(0)}%`); inner.style.setProperty('--my', `${(50 + y * 90).toFixed(0)}%`);
      });
      art.addEventListener('pointerleave', () => { inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); });
    }
    onVisible($('.numcard-art'), () => renderCard(true), { threshold: 0.5 });
  }

  function renderTiers() {
    $('#tierGrid').innerHTML = club.tiers.map((t) => `
      <li class="tier tier-${t.id}">
        <span class="tier-tag">${t.id === 'bord' ? L(t.tag).replace(/Nº/g, NO) : L(t.tag)}</span>
        <span class="tier-name">${L(t.name)}</span>
        <div class="tier-price"><b>${kr(t.price)}</b> kr.<span>${T(`klubåret ${club.year}`, `club year ${club.year}`)}</span></div>
        ${t.seats ? `<span class="tier-seats" aria-label="${t.seats} ${T('pladser', 'seats')}">${'<i></i>'.repeat(t.seats)}</span>` : ''}
        <ul class="tier-lines">${L(t.lines).map((l) => `<li>${l}</li>`).join('')}</ul>
        <a class="btn btn--ghost" data-club-link="#bliv-medlem" href="${clubHref('#bliv-medlem')}" target="_blank" rel="noopener"><span>${L(t.choose)} ↗</span></a>
      </li>`).join('');
  }
  function renderYear() {
    $('#yearList').innerHTML = club.evenings.map((e) => `
      <li class="ev-card">
        <figure><img src="${e.img}" alt="" loading="lazy" decoding="async"></figure>
        <span class="ev-month">${MONTHS[lang][e.m - 1]}</span>
        <h4>${L(e.name)}</h4>
        <p>${L(e.text)}</p>
        <div class="ev-for">${e.for.map((id) => `<span>${tierName(id)}</span>`).join('')}</div>
      </li>`).join('');
  }
  renderers.push(renderClubCount, () => renderCard(false), renderTiers, renderYear);

  /* ======================================================================
     BATCH FILMS – Higgsfield reels with a cinematic photo fallback
     ====================================================================== */
  const REELS = [
    { imgs: ['assets/img/bar-pour.avif', 'assets/img/beer.avif', 'assets/img/firefly.avif'], subs: { da: ['Nexø, fredag aften.', 'Fadet er frisk.', 'Ingen KPI. Kun IPA.'], en: ['Nexø, Friday night.', 'The keg is fresh.', 'No KPI. Just IPA.'] } },
    { imgs: ['assets/img/sign.avif', 'assets/img/sunset-drinks.avif', 'assets/img/chairs.avif'], subs: { da: ['Salt luft.', 'Gyldne timer.', 'Skål, Nexø.'], en: ['Salt air.', 'Golden hours.', 'Cheers, Nexø.'] } },
    { imgs: ['assets/img/lightstrip.avif', 'assets/club/ev-barrel-672.webp', 'assets/img/no-boring-beer.avif'], subs: { da: ['Lille. Med vilje.', '300 numre i klubåret 2027.', 'Ét af dem kan være dit.'], en: ['Small. On purpose.', '300 numbers in club year 2027.', 'One of them could be yours.'] } }
  ];
  function initFilms() {
    const media = $('#screenMedia'), sub = $('#screenSub'), tc = $('#screenTC'), rec = $('#screenRec'), screen = $('#screen');
    const tabs = $$('.reel'), films = (C.videos && C.videos.films) || [];
    const slots = REELS.map((r, i) => {
      const f = films[i] || {};
      if (f.src && !reduced) {
        const v = document.createElement('video');
        Object.assign(v, { muted: true, playsInline: true, preload: 'none', src: f.src, poster: f.poster || '' });
        v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); media.appendChild(v);
        return { video: v, imgs: [] };
      }
      return { video: null, imgs: r.imgs.map((src) => { const im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.src = src; media.appendChild(im); return im; }) };
    });
    let cur = 0, playing = true, inView = false, elapsed = 0, lastSub = -1, lastFrame = -1, typer = 0;
    const DUR = 9;
    const typeSub = (text) => {
      clearInterval(typer);
      if (reduced) { sub.textContent = text; return; }
      sub.textContent = ''; let i = 0;
      typer = setInterval(() => { sub.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typer); }, 34);
    };
    function show(i) {
      cur = i; elapsed = 0; lastSub = -1; lastFrame = -1;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); $('.bar', t).style.transform = 'scaleX(0)'; });
      rec.textContent = `Batch Film 0${i + 1}`;
      $$('.is-on', media).forEach((n) => n.classList.remove('is-on'));
      slots.forEach((s, k) => { if (s.video && k !== i) s.video.pause(); });
      const s = slots[i];
      if (s.video) { s.video.currentTime = 0; s.video.classList.add('is-on'); if (inView && playing) s.video.play().catch(() => {}); }
    }
    tabs.forEach((t) => t.addEventListener('click', () => { playing = true; show(Number(t.dataset.reel)); }));
    screen.addEventListener('click', () => {
      playing = !playing; screen.dataset.cursorLabel = playing ? 'Pause' : 'Play';
      const s = slots[cur]; if (s.video) playing ? s.video.play().catch(() => {}) : s.video.pause();
    });
    whileVisible(screen, (on) => { inView = on; const s = slots[cur]; if (s.video) on && playing ? s.video.play().catch(() => {}) : s.video.pause(); });
    show(0);
    renderers.push(() => { lastSub = -1; });
    tickers.add((t, dt) => {
      if (!inView) return;
      const s = slots[cur];
      const dur = s.video && s.video.duration ? s.video.duration : DUR;
      if (playing && !motionPaused) elapsed += dt;
      if (s.video && s.video.duration) elapsed = s.video.currentTime;
      const p = clamp(elapsed / dur, 0, 1);
      $('.bar', tabs[cur]).style.transform = `scaleX(${p.toFixed(4)})`;
      const k = Math.min(2, Math.floor(p * 3));
      if (!s.video && k !== lastFrame) { s.imgs.forEach((im, j) => im.classList.toggle('is-on', j === k)); lastFrame = k; }
      if (k !== lastSub) { lastSub = k; typeSub((REELS[cur].subs[lang] || REELS[cur].subs.da)[k]); }
      tc.textContent = `00:00:${String(Math.floor(elapsed)).padStart(2, '0')}:${String(Math.floor((elapsed % 1) * 24)).padStart(2, '0')}`;
      if (p >= 1 && playing && !motionPaused) show((cur + 1) % slots.length);
    });
  }

  /* ======================================================================
     EVENTS
     ====================================================================== */
  function renderEvents() {
    const now = Date.now();
    const evs = (C.events || []).map((e) => ({ ...e, t: e.date ? new Date(e.date).getTime() : null }));
    const upcoming = evs.filter((e) => e.t && e.t >= now).sort((a, b) => a.t - b.t);
    const tba = evs.filter((e) => !e.t), past = evs.filter((e) => e.t && e.t < now).sort((a, b) => b.t - a.t);
    const fmt = (t) => { const d = new Date(t); return { dm: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`, sub: new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'da-DK', { weekday: 'long', year: 'numeric', timeZone: 'Europe/Copenhagen' }).format(d) }; };
    const arrow = '<svg viewBox="0 0 20 20"><path d="M4 16 16 4M7 4h9v9"/></svg>';
    $('#evList').innerHTML = [...upcoming, ...tba, ...past].map((e) => {
      const isPast = e.t && e.t < now;
      const d = e.t ? fmt(e.t) : { dm: e.label ? L(e.label) : T('Snart', 'Soon'), sub: e.club ? T('Kun for medlemmer', 'Members only') : T('Følg med', 'Stay tuned') };
      const ext = /^https?:/.test(e.url || '');
      const tags = [...(e.tags || []), ...(isPast ? [T('Afholdt', 'Past')] : [])];
      return `<a class="ev${isPast ? ' is-past' : ''}${e.club ? ' is-club' : ''}" href="${e.url || '#events'}" ${ext ? 'target="_blank" rel="noopener"' : ''}>
        <div class="ev-date">${d.dm}<small>${d.sub}</small></div>
        <div class="ev-body"><h3>${L(e.title)}</h3><p>${L(e.text)}</p><div class="ev-tags">${tags.map((x) => `<span>${x}</span>`).join('')}</div></div>
        <span class="ev-cta" aria-hidden="true">${arrow}</span>
        ${e.img ? `<span class="ev-img" aria-hidden="true"><img src="${e.img}" alt="" loading="lazy"></span>` : ''}
      </a>`;
    }).join('');
  }
  renderers.push(renderEvents);

  /* ======================================================================
     MAP · FOOTER · REVEALS · EGGS
     ====================================================================== */
  function initMap() {
    let html = '';
    for (let x = -60; x <= 660; x += 60) html += `<line x1="${x}" y1="-30" x2="${x}" y2="705"/>`;
    for (let y = -30; y <= 705; y += 60) html += `<line x1="-60" y1="${y}" x2="660" y2="${y}"/>`;
    $('#seaGrid').innerHTML = html;
    $('#dirBtn').href = C.directions || '#';
    if (!hasGSAP || reduced) return;
    const coast = $('#coast'), len = coast.getTotalLength();
    gsap.set(coast, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(coast, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#map', start: 'top 85%', end: 'center 45%', scrub: 0.6 } });
    gsap.from('.map .town', { opacity: 0, y: 8, stagger: 0.12, scrollTrigger: { trigger: '#map', start: 'top 55%' } });
    gsap.from('.map .here', { opacity: 0, scale: 0, svgOrigin: '554.8 495', duration: 1, ease: 'back.out(3)', scrollTrigger: { trigger: '#map', start: 'top 45%' } });
  }

  function initFooter() {
    const footer = $('#footer'), space = $('#footerSpace');
    const fit = () => {
      footer.classList.remove('is-static');
      const h = footer.offsetHeight;
      if (reduced || h > innerHeight + 2) { footer.classList.add('is-static'); space.style.height = '0px'; } else space.style.height = h + 'px';
    };
    fit(); addEventListener('resize', fit);
    if (hasGSAP && !reduced) gsap.fromTo('.footer-logo', { yPercent: 30, scale: 0.92 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: space, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  function initReveals() {
    if (!hasGSAP || reduced) { document.documentElement.classList.add('reduced'); return; }
    ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }) });
    $$('[data-split]').forEach((h) => {
      h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="split-line" style="display:inline-block"><span>${w}</span></span>`).join(' ');
      gsap.from($$('.split-line > span', h), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    $$('[data-scramble]').forEach((el) => onVisible(el, () => scramble(el, el.textContent, 0.8), { threshold: 1 }));
    gsap.from('.club-title > span', { yPercent: 40, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.club-title', start: 'top 85%' } });
  }

  function initEggs() {
    let buf = '';
    addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (buf.endsWith('ipa')) { burst(innerWidth / 2, innerHeight * 0.7, 80); toast(T('Ingen kedelig øl. Aldrig.', 'No boring beer. Ever.')); buf = ''; }
      if (buf.endsWith('kpi')) { toast(T('KPI? Ikke her, kammerat.', 'KPI? Not here, mate.')); buf = ''; }
    });
  }

  /* ======================================================================
     DOOR – liquid-fill loader + age gate
     ====================================================================== */
  function initDoor(hero) {
    const door = $('#door'), pct = $('#doorPct'), gate = $('#doorGate'), liquid = $('#doorLiquid'), wave = $('#doorWave'), foam = $('#doorFoam');
    const main = $('#main'), header = $('#header');
    const verified = store.get('sb-18') === '1';
    const clip = $('#doorClip');
    logoDs.forEach((d) => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); clip.appendChild(p); });
    main.inert = true; header.inert = true;
    if (lenis) lenis.stop();
    const heroImg = $('.hero-fallback');
    const tasks = [document.fonts ? document.fonts.ready : Promise.resolve(), heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(), new Promise((r) => setTimeout(r, reduced ? 200 : verified ? 900 : 1500))];
    let done = 0, target = 0, shown = 0, finished = false, gateShown = false, prev = performance.now();
    tasks.forEach((p) => p.then(() => { done++; target = (done / tasks.length) * 100; }));
    setTimeout(() => { done = tasks.length; target = 100; }, 4000);
    const doorTick = (t) => {
      if (finished) return;
      const now = performance.now(), dt = Math.min(1, (now - prev) / 1000); prev = now;
      shown = Math.min(100, shown + Math.max(0, target - shown) * (1 - Math.exp(-dt * 5)) + (shown < target ? dt * 18 : 0));
      if (target < 100) shown = Math.min(shown, 96);
      pct.textContent = String(Math.round(shown)).padStart(3, '0');
      liquid.setAttribute('transform', `translate(0 ${(LOGO_H + 20 - (shown / 100) * (LOGO_H + 60)).toFixed(1)})`);
      const wx = -((t * 160) % 505);
      wave.setAttribute('transform', `translate(${wx.toFixed(1)} 0)`); foam.setAttribute('transform', `translate(${(wx * 0.7 - 120).toFixed(1)} 0)`);
      if (shown >= 99.5 && done >= tasks.length && !gateShown) { gateShown = true; verified ? enter() : showGate(); }
    };
    tickers.add(doorTick);
    function showGate() {
      if (hasGSAP) gsap.fromTo(gate, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' });
      else { gate.style.opacity = 1; gate.style.visibility = 'visible'; }
      setTimeout(() => $('#doorYes').focus({ preventScroll: true }), 300);
    }
    $('#doorYes').addEventListener('click', (e) => { store.set('sb-18', '1'); burst(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 50); enter(); });
    $('#doorNo').addEventListener('click', () => {
      $('#doorNote').textContent = T('Kom tilbage, når du er fyldt 18.', 'Come back when you are 18.');
      if (hasGSAP) gsap.fromTo('.door-actions', { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
    });
    function enter() {
      if (finished) return;
      finished = true; tickers.delete(doorTick);
      main.inert = false; header.inert = false;
      document.body.classList.remove('is-locked');
      const finish = () => { door.remove(); if (lenis) lenis.start(); if (hasGSAP) ScrollTrigger.refresh(); };
      if (!reduced) {
        // CSS transitions run on the compositor: the door opens on time even in a throttled tab
        door.classList.add('is-leaving');
        setTimeout(() => hero.intro(), 550);
        setTimeout(finish, 1450);
      } else { door.style.display = 'none'; finish(); hero.intro(); }
    }
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  function initScroll() {
    if (!hasGSAP) return;
    if (!reduced && fine && window.Lenis) {
      lenis = new Lenis({ lerp: 0.14, smoothWheel: true, wheelMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => ScrollTrigger.refresh());
  }

  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  initI18n();
  initScroll();
  initCursor();
  initNav();
  initPint();
  initMotionToggle();
  const glOn = initHeroGL();
  const hero = initHeroMask(glOn);
  initMarquees();
  initTapGlass();
  initHarbour();
  initClubLight();
  initClubCard();
  initFilms();
  initMap();
  initFooter();
  initReveals();
  initMagnetic();
  initEggs();
  renderers.forEach((fn) => fn(true));
  initDoor(hero);
})();
