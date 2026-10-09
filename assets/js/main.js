/* ==========================================================================
   SMALL BATCH — Nexø Havn
   Vanilla JS + GSAP/ScrollTrigger + Lenis. No build step.
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

  let lang = 'da';
  let motionPaused = store.get('sb-motion') === 'off';
  let lenis = null;
  const tickers = new Set();          // per-frame callbacks (t, dt)
  const T = (da, en) => (lang === 'en' ? en : da);
  const L = (o) => (o && typeof o === 'object' ? (o[lang] ?? o.da) : o);

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- shared frame loop ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(64, now - last) / 1000; last = now;
    tickers.forEach((fn) => fn(now / 1000, dt));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ======================================================================
     I18N — Danish lives in the markup, English in data-en attributes
     ====================================================================== */
  const I18N_ATTRS = ['placeholder', 'aria-label', 'alt'];
  const CURSOR_LABELS = { Skål: 'Cheers', Vend: 'Flip', Låst: 'Locked', Play: 'Play', Pause: 'Pause', Skænk: 'Pour' };
  const renderers = [];

  function initI18n() {
    $('#mcardName').removeAttribute('data-en');
    $$('[data-en]').forEach((el) => { if (!el.hasAttribute('data-da')) el.dataset.da = el.innerHTML; });
    I18N_ATTRS.forEach((a) => $$(`[data-en-${a}]`).forEach((el) => {
      if (!el.hasAttribute(`data-da-${a}`)) el.setAttribute(`data-da-${a}`, el.getAttribute(a) || '');
    }));
    $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
    const saved = store.get('sb-lang');
    const nav = (navigator.language || 'da').toLowerCase();
    setLang(saved || (nav.startsWith('da') || nav.startsWith('nb') || nav.startsWith('no') ? 'da' : 'en'), true);
  }

  function setLang(l, initial) {
    lang = l === 'en' ? 'en' : 'da';
    document.documentElement.lang = lang;
    store.set('sb-lang', lang);
    $$('[data-en]').forEach((el) => {
      const v = lang === 'en' ? el.dataset.en : el.dataset.da;
      if (el.innerHTML !== v) el.innerHTML = v;
    });
    I18N_ATTRS.forEach((a) => $$(`[data-en-${a}]`).forEach((el) => {
      el.setAttribute(a, lang === 'en' ? el.getAttribute(`data-en-${a}`) : el.getAttribute(`data-da-${a}`));
    }));
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    $('.pint-tip').textContent = T('Skål!', 'Cheers!');
    renderers.forEach((fn) => fn(initial));
    if (!initial && hasGSAP) requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  /* ======================================================================
     UTILITIES — toast, bubble burst, scramble
     ====================================================================== */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  const burst = (() => {
    const cv = $('#burst');
    const ctx = cv.getContext('2d');
    let parts = [];
    let running = false;
    const dpr = Math.min(2, devicePixelRatio || 1);
    function size() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
    size(); addEventListener('resize', size);
    let prev = 0;
    function step(now) {
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0.016; prev = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0);
      parts.forEach((p) => {
        p.vy -= 260 * dt; p.vx *= 0.985; p.x += p.vx * dt + Math.sin(p.life * 8 + p.seed) * 0.6; p.y += p.vy * dt;
        p.life -= dt / p.ttl;
        const a = clamp(p.life * 1.4, 0, 1);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${150 + p.seed * 60 | 0},40,${a * 0.18})`; ctx.fill();
        ctx.lineWidth = 1.4; ctx.strokeStyle = `rgba(255,236,200,${a * 0.85})`; ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`; ctx.fill();
      });
      if (parts.length) requestAnimationFrame(step); else { running = false; prev = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    return (x, y, n = 40) => {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 260;
        parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 120, r: 3 + Math.random() * 11, life: 1, ttl: 1 + Math.random() * 1.2, seed: Math.random() });
      }
      if (!running) { running = true; requestAnimationFrame(step); }
    };
  })();

  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ0123456789#%&*+';
  function scramble(el, finalText, dur = 0.9) {
    if (reduced) { el.textContent = finalText; return; }
    const start = performance.now();
    const chars = [...finalText];
    const reveal = chars.map((_, i) => (i / chars.length) * 0.7 + Math.random() * 0.3);
    function step(now) {
      const p = clamp((now - start) / (dur * 1000), 0, 1);
      el.textContent = chars.map((ch, i) => (ch === ' ' || p >= reveal[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (p < 1) requestAnimationFrame(step); else el.textContent = finalText;
    }
    requestAnimationFrame(step);
  }

  function onVisible(el, fn, opts = { threshold: 0.2 }) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); }
    }), opts);
    io.observe(el);
    return io;
  }

  /* ======================================================================
     COPENHAGEN TIME + HOURS / STATUS
     ====================================================================== */
  const DAYS = { da: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
  const DAYS_SHORT = { da: ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
  function nowCph() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
  }
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
  const hours = C.hours || {};
  const hoursKnown = Object.values(hours).some(Boolean);

  function openState() {
    const { day, min } = nowCph();
    const today = hours[day];
    const yest = hours[(day + 6) % 7];
    // past-midnight spill from yesterday
    if (yest) { const o = toMin(yest[0]); let c = toMin(yest[1]); if (c <= o && min < c) return { open: true, until: yest[1] }; }
    if (today) { const o = toMin(today[0]); let c = toMin(today[1]); if (c <= o) c += 1440; if (min >= o && min < c) return { open: true, until: today[1] }; }
    for (let i = 0; i < 7; i++) {
      const d = (day + i) % 7; const h = hours[d];
      if (h && (i > 0 || toMin(h[0]) > min)) return { open: false, next: { day: d, at: h[0], today: i === 0 } };
    }
    return { open: false };
  }

  function renderStatus() {
    const pill = $('#status'), txt = $('#statusText');
    pill.classList.remove('is-open', 'is-closed', 'is-info');
    if (!hoursKnown) { pill.classList.add('is-info'); txt.textContent = T('20 haner · Nexø Havn', '20 taps · Nexø Havn'); return; }
    const s = openState();
    if (s.open) { pill.classList.add('is-open'); txt.textContent = T(`Åben nu · til ${s.until}`, `Open now · until ${s.until}`); }
    else {
      pill.classList.add('is-closed');
      txt.textContent = s.next ? T(`Lukket · åbner ${s.next.today ? 'kl.' : DAYS_SHORT.da[s.next.day]} ${s.next.at}`, `Closed · opens ${s.next.today ? 'at' : DAYS_SHORT.en[s.next.day]} ${s.next.at}`) : T('Lukket', 'Closed');
    }
  }

  function renderHours() {
    const box = $('#hours');
    if (!hoursKnown) {
      box.className = 'hours-unknown';
      box.innerHTML = `<span class="mess">${T('Åbningstider følger', 'Hours coming soon')}</span>${T('Vi er ved at lægge vagtplanen. Følg <a class="blaze" href="' + C.social.instagram + '" target="_blank" rel="noopener">@smallbatchnexo</a> for åbningstider — eller kig forbi og se, om lyset er tændt.', 'We are sorting the rota. Follow <a class="blaze" href="' + C.social.instagram + '" target="_blank" rel="noopener">@smallbatchnexo</a> for opening hours — or swing by and see if the lights are on.')}`;
      return;
    }
    box.className = 'hours';
    const { day } = nowCph();
    const order = [1, 2, 3, 4, 5, 6, 0];
    box.innerHTML = order.map((d) => {
      const h = hours[d];
      return `<div class="hours-row${d === day ? ' is-today' : ''}"><span>${DAYS[lang][d]}</span><span class="${h ? '' : 'closed'}">${h ? `${h[0]} – ${h[1]}` : T('Lukket', 'Closed')}</span></div>`;
    }).join('');
  }
  renderers.push(renderStatus, renderHours);
  setInterval(renderStatus, 60000);

  /* ======================================================================
     GRAIN · CURSOR · MAGNETIC
     ====================================================================== */
  function initGrain() {
    const g = $('#grain');
    if (reduced) { g.remove(); return; }
    const c = document.createElement('canvas'); c.width = c.height = 180;
    const x = c.getContext('2d'); const img = x.createImageData(180, 180);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    g.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
    if (isSmall()) { g.style.mixBlendMode = 'normal'; g.style.opacity = '.035'; }
  }

  function initCursor() {
    if (!fine || reduced) return;
    document.documentElement.classList.add('has-cursor');
    const cur = $('#cursor'), ring = $('.cursor-ring', cur), dot = $('.cursor-dot', cur), label = $('span', ring);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; }, { passive: true });
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor-label]');
      const hov = e.target.closest('a, button, [role="button"], label, #tapBoard .tap');
      if (lab) { const t = lab.dataset.cursorLabel; label.textContent = lang === 'en' ? (CURSOR_LABELS[t] || t) : t; cur.classList.add('is-label'); cur.classList.remove('is-hover'); }
      else { cur.classList.remove('is-label'); cur.classList.toggle('is-hover', !!hov); }
    });
    document.addEventListener('pointerleave', () => { cur.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { cur.style.opacity = '1'; });
    tickers.add(() => { rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18); ring.style.transform = `translate(${rx}px,${ry}px)`; });
  }

  function initMagnetic() {
    if (!fine || reduced || !hasGSAP) return;
    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ======================================================================
     HEADER · MENU · ANCHORS · PINT PROGRESS · MOTION TOGGLE
     ====================================================================== */
  function scrollToTarget(hash) {
    if (hash === '#top' || hash === '#') { lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
    const el = document.querySelector(hash);
    if (!el) return;
    const off = -70;
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.6 });
    else scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: reduced ? 'auto' : 'smooth' });
  }

  function initNav() {
    const header = $('#header'), burger = $('#burger'), menu = $('#menu');
    let lastY = 0;
    addEventListener('scroll', () => {
      const y = scrollY;
      header.classList.toggle('is-solid', y > 60);
      header.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
      lastY = y;
    }, { passive: true });

    const setMenu = (open) => {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute('href');
      if (hash === '#main') return;
      e.preventDefault();
      setMenu(false);
      if (a.dataset.tier) selectTier(a.dataset.tier);
      scrollToTarget(hash);
    });
  }

  function initPint() {
    const pint = $('#pint'), beer = $('#pintBeer'), foam = $('#pintFoam'), bub = $('#pintBubbles');
    const bubbles = Array.from({ length: 6 }, (_, i) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', (0.7 + Math.random() * 0.9).toFixed(2)); bub.appendChild(c);
      return { el: c, x: 9 + Math.random() * 16, y: 62 - Math.random() * 50, s: 8 + Math.random() * 14, ph: i };
    });
    let p = 0, shown = 0;
    const read = () => { const max = document.documentElement.scrollHeight - innerHeight; p = max > 0 ? clamp(scrollY / max, 0, 1) : 0; pint.classList.toggle('is-on', scrollY > 300); pint.classList.toggle('is-full', p > 0.985); };
    addEventListener('scroll', read, { passive: true }); read();
    tickers.add((t, dt) => {
      shown = lerp(shown, p, 0.12);
      const top = 62 - shown * 58;
      beer.setAttribute('y', top.toFixed(2));
      foam.setAttribute('y', (top - 3.5).toFixed(2));
      foam.setAttribute('height', (shown > 0.02 ? 4.5 : 0).toString());
      if (motionPaused || reduced) return;
      bubbles.forEach((b) => {
        b.y -= b.s * dt; if (b.y < top + 2) b.y = 62;
        b.el.setAttribute('cx', (b.x + Math.sin(t * 3 + b.ph) * 0.8).toFixed(2)); b.el.setAttribute('cy', b.y.toFixed(2));
        b.el.style.opacity = b.y > top + 2 ? 1 : 0;
      });
    });
  }

  function initMotionToggle() {
    const btn = $('#motionToggle');
    const apply = () => {
      document.documentElement.classList.toggle('motion-paused', motionPaused);
      btn.setAttribute('aria-pressed', String(motionPaused));
      const txt = $('.txt', btn);
      txt.dataset.da = motionPaused ? 'Start bevægelse' : 'Pause bevægelse';
      txt.dataset.en = motionPaused ? 'Play motion' : 'Pause motion';
      txt.textContent = lang === 'en' ? txt.dataset.en : txt.dataset.da;
    };
    btn.addEventListener('click', () => { motionPaused = !motionPaused; store.set('sb-motion', motionPaused ? 'off' : 'on'); apply(); });
    apply();
  }

  /* ======================================================================
     HERO — WebGL beer (image or Higgsfield video as texture)
     ====================================================================== */
  const heroState = { zoom: 0, fade: 1, mouse: [0.5, 0.5], vel: 0, active: true };

  function pickHeroVideo() {
    const v = (C.videos && C.videos.hero) || {};
    if (v.byTime) {
      const h = Math.floor(nowCph().min / 60);
      const slot = h < 10 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'dusk' : 'night';
      if (v.byTime[slot]) return v.byTime[slot];
    }
    if (isSmall() && v.srcMobile) return v.srcMobile;
    return v.src || '';
  }

  function initHeroGL() {
    const canvas = $('#heroGL');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return;

    const vs = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
    const fs = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform vec2 uRes, uImg, uMouse;
      uniform float uTime, uVel, uZoom, uFade;
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
        vec2 uv=vUv;
        uv=(uv-.5)/(1.+uZoom*.35)+.5;
        float t=uTime*.05;
        vec2 flow=vec2(noise(uv*3.+vec2(t,-t*1.3)), noise(uv*3.+vec2(-t*.7,t)+7.))-.5;
        uv+=flow*.014;
        vec2 m=uMouse; vec2 d=(uv-m)*asp; float dist=length(d);
        uv+=normalize(d+1e-5)*sin(dist*36.-uTime*4.)*exp(-dist*7.)*(.0025+uVel*.03)/asp;
        float a=exp(-dist*dist*16.)*uVel*.9;
        vec2 rr=(uv-m)*asp; rr=mat2(cos(a),-sin(a),sin(a),cos(a))*rr; uv=m+rr/asp;
        vec4 b1=bubbles(vUv*asp,7.,.32,1.);
        vec4 b2=bubbles(vUv*asp+3.1,13.,.55,7.);
        uv+=(b1.xy*.02+b2.xy*.012)/asp;
        vec2 tuv=cover(uv);
        float ca=.0012+uVel*.007;
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
        gl_FragColor=vec4(col,1.);
      }`;

    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
    const prog = gl.createProgram();
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uTex', 'uRes', 'uImg', 'uMouse', 'uTime', 'uVel', 'uZoom', 'uFade'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    let imgW = 16, imgH = 9, ready = false, video = null;

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      imgW = img.naturalWidth; imgH = img.naturalHeight; ready = true; canvas.classList.add('is-ready');
    };
    img.src = $('.hero-fallback').currentSrc || $('.hero-fallback').src;

    const vsrc = !reduced && pickHeroVideo();
    if (vsrc) {
      video = document.createElement('video');
      Object.assign(video, { muted: true, loop: true, playsInline: true, autoplay: true, preload: 'auto', src: vsrc });
      video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
      video.play().catch(() => { /* low-power mode: stay on still */ });
    }

    const dpr = Math.min(isSmall() ? 1 : 1.5, devicePixelRatio || 1);
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize(); addEventListener('resize', resize);

    // pointer → smoothed uv mouse + velocity
    let tx = 0.5, ty = 0.5, px = 0.5, py = 0.5, hasPointer = false;
    $('#top').addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width; ty = 1 - (e.clientY - r.top) / r.height; hasPointer = true;
    }, { passive: true });

    const io = new IntersectionObserver(([e]) => { heroState.active = e.isIntersecting; }, { threshold: 0 });
    io.observe($('#top'));

    let time = 0;
    tickers.add((t, dt) => {
      if (!heroState.active || !ready && !video) return;
      if (!motionPaused && !reduced) time += dt;
      if (!hasPointer) { tx = 0.5 + Math.sin(time * 0.35) * 0.22; ty = 0.5 + Math.cos(time * 0.27) * 0.18; }
      const nx = lerp(px, tx, 0.08), ny = lerp(py, ty, 0.08);
      const sp = Math.hypot(nx - px, ny - py) / Math.max(dt, 0.001);
      heroState.vel = lerp(heroState.vel, clamp(sp * 0.35, 0, 1), 0.08);
      px = nx; py = ny;
      if (video && video.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        imgW = video.videoWidth; imgH = video.videoHeight;
        if (!ready) { ready = true; canvas.classList.add('is-ready'); }
      }
      if (!ready) return;
      gl.uniform1i(U.uTex, 0);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform2f(U.uImg, imgW, imgH);
      gl.uniform2f(U.uMouse, px, py);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uVel, reduced ? 0 : heroState.vel);
      gl.uniform1f(U.uZoom, heroState.zoom);
      gl.uniform1f(U.uFade, heroState.fade);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  }

  /* ======================================================================
     HERO — SVG cut-out logo + zoom-through-the-letter scroll
     ====================================================================== */
  const LOGO_W = 1010, LOGO_H = 665;
  const logoDs = $$('#sb-logo path').map((p) => p.getAttribute('d'));
  let heroLayout = null;

  function findFocal() {
    // deepest-enough point inside a letter, nearest the logo centre
    const ctx = document.createElement('canvas').getContext('2d');
    const P = new Path2D(); logoDs.forEach((d) => P.addPath(new Path2D(d)));
    const inside = (x, y) => ctx.isPointInPath(P, x, y);
    const cx = LOGO_W / 2, cy = LOGO_H / 2;
    const cands = [];
    for (let y = 40; y < LOGO_H - 40; y += 7) for (let x = 40; x < LOGO_W - 40; x += 7) cands.push([x, y, Math.hypot((x - cx) * 0.8, y - cy)]);
    cands.sort((a, b) => a[2] - b[2]);
    for (const depth of [34, 28, 22, 16]) {
      for (const [x, y] of cands) {
        if (!inside(x, y)) continue;
        let ok = true;
        for (let a = 0; a < 16 && ok; a++) { const ang = (a / 16) * Math.PI * 2; ok = inside(x + Math.cos(ang) * depth, y + Math.sin(ang) * depth); }
        if (ok) return { x, y, depth };
      }
    }
    return { x: cx, y: cy, depth: 10 };
  }

  let relayoutHero = () => {};
  function initHeroMask() {
    const svg = $('#heroMask');
    const groups = $$('.m-logo', svg);
    const hero = $('#top');
    const focal = findFocal();
    const st = { z: 0, intro: 0 };

    function layout() {
      const W = hero.clientWidth || innerWidth, H = hero.clientHeight || innerHeight;
      if (!W || !H) return;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const lw = Math.min(W * (isSmall() ? 0.9 : 0.8), 1240, H * 0.58 * (LOGO_W / LOGO_H));
      const k0 = lw / LOGO_W;
      const x0 = (W - lw) / 2, y0 = (H - LOGO_H * k0) / 2 + H * 0.015;
      const Z = (Math.hypot(W, H) / 2) / (focal.depth * k0) * 1.25;
      heroLayout = { W, H, k0, x0, y0, Z };
      apply();
    }
    function apply() {
      if (!heroLayout) return;
      const { W, H, k0, x0, y0, Z } = heroLayout;
      const z = lerp(1, Z, st.z);
      const intro = 0.9 + 0.1 * st.intro;
      const k = k0 * z * intro;
      const fsx = x0 + focal.x * k0, fsy = y0 + focal.y * k0;
      const e = st.z * st.z;
      const cx = lerp(fsx, W / 2, e), cy = lerp(fsy, H / 2, e);
      if (!Number.isFinite(k) || !Number.isFinite(cx) || !Number.isFinite(cy)) return;
      const tr = `translate(${(cx - focal.x * k).toFixed(2)} ${(cy - focal.y * k).toFixed(2)}) scale(${k.toFixed(5)})`;
      groups.forEach((g) => g.setAttribute('transform', tr));
    }
    layout();
    addEventListener('resize', layout);
    if (hasGSAP) ScrollTrigger.addEventListener('refresh', layout);

    // split NO BORING BEER into chars
    $$('#heroAfter .ln').forEach((ln) => { ln.innerHTML = [...ln.textContent].map((c) => (c === ' ' ? ' ' : `<span class="char">${c}</span>`)).join(''); });

    if (!hasGSAP || reduced) { st.intro = 1; apply(); return { intro: () => {} }; }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.5), scrub: 0.7, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
    });
    tl.to(st, { z: 1, duration: 1, ease: 'power2.in', onUpdate: apply }, 0)
      .to('#heroUI', { autoAlpha: 0, y: -40, duration: 0.25, ease: 'none' }, 0)
      .to('.m-rim', { opacity: 0, duration: 0.3 }, 0.1)
      .to(heroState, { zoom: 1, duration: 1.4, ease: 'none' }, 0)
      .set(svg, { autoAlpha: 0 }, 0.99)
      .fromTo('#heroAfter .char', { yPercent: 110, opacity: 0, rotate: 10 }, { yPercent: 0, opacity: 1, rotate: 0, stagger: 0.025, duration: 0.35, ease: 'back.out(2)' }, 0.98)
      .to(heroState, { fade: 0.55, duration: 0.4 }, 1.0)
      .to({}, { duration: 0.35 });
    return {
      intro() {
        layout();
        gsap.fromTo(st, { intro: 0 }, { intro: 1, duration: 1.8, ease: 'expo.out', onUpdate: apply });
        gsap.from('.hero-kicker > *', { yPercent: 120, opacity: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', delay: 0.2 });
        gsap.from('.hero-corner, .hero-scroll, .motion-toggle', { y: 30, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', delay: 0.35 });
        gsap.from('#header', { yPercent: -100, duration: 1.1, ease: 'expo.out', delay: 0.3 });
      }
    };
  }

  /* ======================================================================
     MARQUEES — velocity reactive
     ====================================================================== */
  function initMarquees() {
    const words = ['No boring beer', 'Mindre KPI', 'Mere IPA', 'Nexø Havn', 'Hane 21', 'Small Batch'];
    const hop = '<svg viewBox="0 0 32 43" aria-hidden="true"><use href="#sb-hop"/></svg>';
    const tracks = $$('.marquee-track');
    tracks.forEach((track) => {
      const html = words.map((w) => `<span class="marquee-item">${w}${hop}</span>`).join('');
      track.innerHTML = html + html + html;
    });
    if (reduced) return;
    let vel = 0;
    if (hasGSAP) ScrollTrigger.create({ onUpdate: (self) => { vel = clamp(self.getVelocity() / 900, -6, 6); } });
    const st = tracks.map((track) => ({ track, x: 0, dir: Number(track.dataset.marquee) || 1, w: 0 }));
    const measure = () => st.forEach((s) => { s.w = s.track.scrollWidth / 3; });
    measure(); addEventListener('resize', measure); document.fonts && document.fonts.ready.then(measure);
    let boost = 0;
    tickers.add((t, dt) => {
      boost = lerp(boost, vel, 0.08); vel *= 0.9;
      if (motionPaused) return;
      st.forEach((s) => {
        const sp = (60 + Math.abs(boost) * 90) * s.dir * (boost < -0.2 ? -1 : 1);
        s.x -= sp * dt;
        if (s.w) { if (s.x <= -s.w) s.x += s.w; if (s.x > 0) s.x -= s.w; }
        s.track.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0) skewX(${clamp(-boost * 2.5, -10, 10).toFixed(2)}deg)`;
      });
    });
  }

  /* ======================================================================
     MANIFEST — scroll-scrubbed word reveal with inline photo pills
     ====================================================================== */
  const MANIFEST = {
    da: 'Styrken i at være [beer] lille, lokal [hug-nexo] og *anderledes.* Hvor kærligheden til det lille bryg [bar-pour] vinder over ideen om at maksimere bundlinjen. Lige præcis lille nok til at lægge mærke til alle de små ting, [sunset-drinks] der gør en *stor forskel.*',
    en: 'The strength of being [beer] small, local [hug-nexo] and *different.* Where love for the small brew [bar-pour] beats the idea of maximising the bottom line. Just small enough to notice all the little things [sunset-drinks] that make a *big difference.*'
  };
  let manifestST = null;
  function renderManifest() {
    const el = $('#manifestText');
    let serif = false;
    el.innerHTML = MANIFEST[lang].split(' ').map((tok) => {
      const m = tok.match(/^\[(.+)\]$/);
      if (m) return `<span class="pill" aria-hidden="true"><img src="assets/img/${m[1]}.avif" alt="" loading="lazy" decoding="async"></span>`;
      let w = tok;
      const open = w.startsWith('*'); const close = w.endsWith('*');
      w = w.replace(/\*/g, '');
      if (open) serif = true;
      const out = `<span class="w${serif ? ' serif' : ''}">${w}</span>`;
      if (close) serif = false;
      return out;
    }).join(' ');
    if (manifestST) { manifestST.scrollTrigger && manifestST.scrollTrigger.kill(); manifestST.kill(); manifestST = null; }
    if (!hasGSAP || reduced) { $$('.w, .pill', el).forEach((n) => { n.style.opacity = 1; n.style.transform = 'none'; }); return; }
    const items = $$('.w, .pill', el);
    manifestST = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.5 } });
    items.forEach((n, i) => {
      if (n.classList.contains('pill')) manifestST.to(n, { opacity: 1, scale: 1, duration: 1.2, ease: 'back.out(2)' }, i * 0.5);
      else manifestST.to(n, { opacity: 1, duration: 0.8 }, i * 0.5);
    });
  }
  renderers.push(renderManifest);

  /* ======================================================================
     TAP BOARD — split-flap names + floating pint that pours
     ====================================================================== */
  const TAG = { core: ['Kerneøl', 'Core'], award: ['Prisvinder', 'Award winner'], strong: ['Stærk', 'Strong'], members: ['Kun medlemmer', 'Members only'] };
  let tapIO = null;
  function renderTaps() {
    const board = $('#tapBoard');
    const taps = C.taps || [];
    board.innerHTML = taps.map((b, i) => {
      const lvl = clamp((b.ibu || 0) / 60, 0, 1) * 100;
      const tag = TAG[b.tag] || TAG.core;
      const dark = parseInt(b.color.slice(1, 3), 16) < 80;
      return `<div class="tap${b.locked ? ' is-locked' : ''}" role="listitem" tabindex="0" style="--c:${b.color};--hc:${dark ? '#d8b98f' : b.color}" data-i="${i}" ${b.locked ? 'data-cursor-label="Låst"' : 'data-cursor-label="Skænk"'}>
        <span class="tap-no">${String(i + 1).padStart(2, '0')}</span>
        <span class="tap-name" data-name="${b.name}">${b.name}</span>
        <span class="tap-style">${b.locked ? `<span style="filter:blur(5px)">${L(b.style)}</span>` : L(b.style)}<small>${L(b.notes)}</small></span>
        <span class="tap-abv">${b.locked ? '??' : b.abv.toFixed(1).replace('.', lang === 'da' ? ',' : '.')} %</span>
        <span class="tap-ibu"><span class="bar"><i style="--lvl:${b.locked ? 100 : lvl}%"></i></span><span>${b.locked ? 'IBU ??' : 'IBU ' + b.ibu}</span></span>
        <span class="tap-tag is-${b.tag || 'core'}">${lang === 'en' ? tag[1] : tag[0]}</span>
      </div>`;
    }).join('');
    if (tapIO) tapIO.disconnect();
    if (reduced) return;
    tapIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const row = e.target; tapIO.unobserve(row);
      const name = $('.tap-name', row);
      setTimeout(() => scramble(name, name.dataset.name, 1.1), Number(row.dataset.i) * 90);
      if (hasGSAP) gsap.from($('.tap-ibu .bar i', row), { scaleX: 0, duration: 1.4, ease: 'expo.out', delay: Number(row.dataset.i) * 0.08 });
    }), { threshold: 0.4 });
    $$('.tap', board).forEach((r) => tapIO.observe(r));
  }
  renderers.push(renderTaps);

  function initTapGlass() {
    const board = $('#tapBoard');
    board.addEventListener('click', (e) => { const r = e.target.closest('.tap.is-locked'); if (r) scrollToTarget('#club'); });
    board.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const r = e.target.closest('.tap.is-locked'); if (r) scrollToTarget('#club'); } });
    if (!fine || reduced || !hasGSAP) return;
    const glass = $('#tapGlass'), beer = $('#glassBeer'), foam = $('#glassFoam'), fill = $('#glassFill'), bub = $('#glassBubbles');
    const bubbles = Array.from({ length: 14 }, () => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', (1 + Math.random() * 2.4).toFixed(2)); bub.appendChild(c);
      return { el: c, x: 36 + Math.random() * 68, y: 60 + Math.random() * 130, s: 30 + Math.random() * 60, ph: Math.random() * 6 };
    });
    let mx = 0, my = 0, gx = 0, gy = 0, vx = 0, on = false, level = 0, levelTarget = 0, waveX = 0;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    board.addEventListener('pointerover', (e) => {
      const row = e.target.closest('.tap'); if (!row) return;
      const b = C.taps[Number(row.dataset.i)];
      const dark = parseInt(b.color.slice(1, 3), 16) < 80;
      beer.setAttribute('fill', b.color); foam.setAttribute('fill', dark ? '#d8b98f' : '#f6efe2');
      if (!on) { gx = mx; gy = my; level = 0; }
      on = true; levelTarget = 1;
      gsap.to(glass, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', overwrite: 'auto' });
      level = Math.min(level, 0.25);
    });
    board.addEventListener('pointerleave', () => { on = false; levelTarget = 0; gsap.to(glass, { opacity: 0, scale: 0.6, duration: 0.35, overwrite: 'auto' }); });
    tickers.add((t, dt) => {
      if (!on && level < 0.01) return;
      const nx = lerp(gx, mx + 90, 0.14), ny = lerp(gy, my - 20, 0.14);
      vx = lerp(vx, (nx - gx) / Math.max(dt, 0.001), 0.2); gx = nx; gy = ny;
      level = lerp(level, levelTarget, 0.05);
      waveX = (waveX + dt * 60) % 80;
      glass.style.translate = `${gx}px ${gy}px`;
      glass.style.rotate = `${clamp(vx * 0.012, -16, 16)}deg`;
      fill.setAttribute('transform', `translate(0 ${(1 - level) * 150})`);
      beer.setAttribute('transform', `translate(${-waveX} ${Math.sin(t * 3) * 2}) skewY(${clamp(-vx * 0.004, -6, 6)})`);
      foam.setAttribute('transform', `translate(${-waveX} ${Math.sin(t * 3) * 2})`);
      const top = 40 + (1 - level) * 150;
      bubbles.forEach((b) => {
        b.y -= b.s * dt; if (b.y < top + 12) b.y = 190;
        b.el.setAttribute('cx', (b.x + Math.sin(t * 4 + b.ph) * 2).toFixed(1)); b.el.setAttribute('cy', b.y.toFixed(1));
      });
    });
  }

  /* ======================================================================
     HARBOUR — pinned horizontal gallery
     ====================================================================== */
  function initHarbour() {
    if (!hasGSAP || reduced) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px)', () => {
      const track = $('#harbourTrack');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '#harbour', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: (self) => { $('#harbourBar').style.transform = `scaleX(${self.progress})`; }
        }
      });
      $$('.shot', track).forEach((s) => {
        const img = $('img, video', s);
        gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      $$('.shot-word', track).forEach((w) => {
        gsap.fromTo(w, { rotate: -6, yPercent: 10 }, { rotate: 4, yPercent: -10, ease: 'none', scrollTrigger: { trigger: w, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return () => { gsap.set(track, { x: 0 }); };
    });
  }

  /* ======================================================================
     CLUB — spotlight, glow cards, seats counter
     ====================================================================== */
  function initClub() {
    const club = $('#club'), dark = $('#clubDark');
    const v = C.videos && C.videos.club;
    if (v && v.src && !reduced) {
      const vid = document.createElement('video');
      Object.assign(vid, { muted: true, loop: true, playsInline: true, autoplay: true, src: v.src, preload: 'metadata' });
      vid.setAttribute('playsinline', ''); vid.setAttribute('muted', '');
      $('#clubBg').prepend(vid); $('#clubBg img').remove();
      onVisible(club, () => vid.play().catch(() => {}), { threshold: 0 });
    }
    let sx = 0.7, sy = 0.25, tx = 0.7, ty = 0.25, pointer = false, inView = false;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(club);
    club.addEventListener('pointermove', (e) => { const r = club.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; pointer = true; }, { passive: true });
    club.addEventListener('pointerleave', () => { pointer = false; });
    tickers.add((t) => {
      if (!inView) return;
      if (!pointer && !motionPaused) { tx = 0.55 + Math.sin(t * 0.4) * 0.3; ty = 0.3 + Math.cos(t * 0.31) * 0.2; }
      sx = lerp(sx, tx, 0.06); sy = lerp(sy, ty, 0.06);
      dark.style.setProperty('--sx', (sx * 100).toFixed(2) + '%');
      dark.style.setProperty('--sy', (sy * club.offsetHeight).toFixed(0) + 'px');
    });

    const perks = $('#perks');
    perks.addEventListener('pointermove', (e) => {
      $$('.perk', perks).forEach((p) => { const r = p.getBoundingClientRect(); p.style.setProperty('--px', `${e.clientX - r.left}px`); p.style.setProperty('--py', `${e.clientY - r.top}px`); });
    }, { passive: true });

    const { seatsTotal = 300, seatsTaken = 0 } = C.club || {};
    const left = Math.max(0, seatsTotal - seatsTaken);
    onVisible($('.seats'), () => {
      const num = $('#seatsNum');
      if (!hasGSAP || reduced) { num.textContent = left; $('#seatsBar').style.width = `${(seatsTaken / seatsTotal) * 100}%`; return; }
      const o = { n: seatsTotal };
      gsap.to(o, { n: left, duration: 2.2, ease: 'expo.out', onUpdate: () => { num.textContent = Math.round(o.n); } });
      gsap.to('#seatsBar', { width: `${(seatsTaken / seatsTotal) * 100}%`, duration: 2.2, ease: 'expo.out' });
    }, { threshold: 0.6 });
    renderers.push(() => {
      const s = (C.club && C.club.season) || '';
      $('#seatsText').textContent = T(`stiftende pladser tilbage af ${seatsTotal} · sæson ${s}`, `founding seats left of ${seatsTotal} · season ${s}`);
    });
  }

  /* ======================================================================
     MEMBER CARD + APPLICATION
     ====================================================================== */
  const TIERS = { guest: ['Praktikant', 'Intern'], member: ['Mellemleder', 'Middle manager'], guild: ['Bestyrelsen', 'The Board'] };
  let tier = 'member';
  let invited = false;
  const pad4 = (n) => String(n).padStart(4, '0');
  const reservedNo = () => (C.club ? (C.club.seatsTaken || 0) + 1 : 1);

  function selectTier(t) {
    tier = TIERS[t] ? t : 'member';
    $('#tierInput').value = tier;
    renderCard();
    if (tier === 'guild') setTimeout(() => $('#fCode').focus({ preventScroll: true }), 1400);
  }

  function renderCard() {
    const saved = JSON.parse(store.get('sb-app') || 'null');
    const name = ($('#fName').value || (saved && saved.name) || '').trim();
    const n = saved ? saved.no : reservedNo();
    const total = (C.club && C.club.seatsTotal) || 300;
    $('#mcardName').textContent = name ? name.toUpperCase() : T('Dit navn', 'Your name');
    $('#mcardSig').textContent = name || '';
    $('#mcardNo').textContent = `HANE 21 · Nº ${pad4(n)} / ${pad4(total)}`;
    const tt = invited ? TIERS.guild : TIERS[tier];
    $('#mcardTier').textContent = lang === 'en' ? tt[1] : tt[0];
    $('#mcard').classList.toggle('is-gold', invited || tier === 'guild' && invited);
  }
  renderers.push(() => { renderCard(); renderDone(); });

  function initCard() {
    const card = $('#mcard'), stage = $('.card-stage');
    // barcode + punch card
    const bc = $('#barcode');
    let seed = 21;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    bc.innerHTML = Array.from({ length: 26 }, () => `<i style="height:${30 + rnd() * 70}%;width:${rnd() > 0.6 ? 3 : 1.5}px"></i>`).join('');
    $('#punch').innerHTML = Array.from({ length: 10 }, (_, i) => (i === 0 ? '<i class="is-stamped"><svg viewBox="0 0 32 43"><use href="#sb-hop"/></svg></i>' : '<i></i>')).join('');

    let flipped = false;
    const flip = () => { flipped = !flipped; card.style.setProperty('--flip', flipped ? '180deg' : '0deg'); };
    card.addEventListener('click', flip);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    card._unflip = () => { if (flipped) flip(); };

    if (!reduced) {
      if (fine) {
        stage.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const x = clamp((e.clientX - r.left) / r.width, -0.2, 1.2), y = clamp((e.clientY - r.top) / r.height, -0.2, 1.2);
          card.classList.add('is-tracking');
          card.style.setProperty('--rx', `${(0.5 - y) * 18}deg`);
          card.style.setProperty('--ry', `${(x - 0.5) * 24}deg`);
          card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`);
        });
        stage.addEventListener('pointerleave', () => { card.classList.remove('is-tracking'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
      } else {
        let inView = false;
        new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(card);
        tickers.add((t) => {
          if (!inView || motionPaused) return;
          card.style.setProperty('--rx', `${Math.sin(t * 0.9) * 8}deg`); card.style.setProperty('--ry', `${Math.cos(t * 0.7) * 12}deg`);
          card.style.setProperty('--mx', `${50 + Math.cos(t * 0.7) * 40}%`); card.style.setProperty('--my', `${50 + Math.sin(t * 0.9) * 40}%`);
        });
      }
    }
    $('#fName').addEventListener('input', renderCard);
    const codes = (C.inviteCodes || []).map((c) => c.toUpperCase());
    $('#fCode').addEventListener('input', (e) => {
      const ok = codes.includes(e.target.value.trim().toUpperCase());
      $('#codeField').classList.toggle('is-valid', ok);
      if (ok && !invited) {
        invited = true; tier = 'guild'; $('#tierInput').value = 'guild';
        const r = card.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 50);
        toast(T('Inviteret. Velkommen i bestyrelsen.', 'Invited. Welcome to the Board.'));
      } else if (!ok && invited) { invited = false; }
      renderCard();
    });
  }

  function renderDone() {
    const saved = JSON.parse(store.get('sb-app') || 'null');
    if (!saved) return;
    $('#applyForm').classList.add('is-done');
    $('#mcard').classList.add('is-stamped');
    if (saved.invited) { invited = true; }
    $('#formDoneText').innerHTML = `${T(`Ansøgningen er modtaget, ${saved.name.split(' ')[0]}. Du har reserveret <b>Nº ${pad4(saved.no)}</b> — vi skriver, når der er en plads ved baren.`, `Application received, ${saved.name.split(' ')[0]}. You've reserved <b>Nº ${pad4(saved.no)}</b> — we'll write when there's a seat at the bar.`)}
      <span class="actions"><button type="button" class="btn btn--sm" id="shareBtn"><span class="btn-dot"></span>${T('Del med en ven', 'Share with a friend')}</button><button type="button" class="btn btn--ghost btn--sm" id="resetBtn">${T('Ny ansøgning', 'New application')}</button></span>`;
    $('#shareBtn').addEventListener('click', async () => {
      const data = { title: 'Hane 21 — Small Batch Nexø', text: T('20 haner på ølalteret. Den 21. er din.', '20 taps on the beer altar. The 21st is yours.'), url: location.href.split('#')[0] + '#club' };
      try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); toast(T('Link kopieret', 'Link copied')); } } catch (e) { /* cancelled */ }
    });
    $('#resetBtn').addEventListener('click', () => {
      try { localStorage.removeItem('sb-app'); } catch (e) { /* noop */ }
      $('#applyForm').classList.remove('is-done'); $('#mcard').classList.remove('is-stamped'); invited = false; renderCard();
    });
  }

  function initForm() {
    const form = $('#applyForm'), err = $('#formError'), btn = $('#applyBtn');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = '';
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim(), email = String(fd.get('email') || '').trim();
      if (!name) { err.textContent = T('Vi skal bruge dit navn.', 'We need your name.'); $('#fName').focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = T('Den e-mail ser lidt mistænkelig ud.', 'That email looks a little suspicious.'); $('#fEmail').focus(); return; }
      if (!fd.get('adult')) { err.textContent = T('Du skal være fyldt 18 for at søge.', 'You must be 18 or over to apply.'); $('#fAdult').focus(); return; }
      const payload = Object.fromEntries(fd.entries());
      payload.invited = invited; payload.lang = lang; payload.submittedAt = new Date().toISOString();
      const label = $('span:last-child', btn); const old = label.textContent;
      label.textContent = T('Sender …', 'Sending …'); btn.disabled = true;
      try {
        if (C.formEndpoint) {
          const res = await fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } else {
          await new Promise((r) => setTimeout(r, 900));
        }
        const no = reservedNo();
        store.set('sb-app', JSON.stringify({ name, no, invited }));
        const card = $('#mcard');
        if (card._unflip) card._unflip();
        card.classList.remove('is-stamped'); void card.offsetWidth; card.classList.add('is-stamped');
        const r = card.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 70);
        renderDone();
        toast(T('Skål! Du er på listen.', "Cheers! You're on the list."));
      } catch (ex) {
        err.textContent = T('Noget gik galt. Prøv igen om lidt.', 'Something went wrong. Try again in a moment.');
      } finally { label.textContent = old; btn.disabled = false; }
    });
  }

  /* ======================================================================
     VAULT COUNTDOWN
     ====================================================================== */
  function initCountdown() {
    const box = $('#countdown');
    const target = C.nextRelease ? new Date(C.nextRelease).getTime() : NaN;
    if (!target || target < Date.now()) { box.parentElement.style.display = 'none'; return; }
    const els = { d: $('[data-cd="d"]', box), h: $('[data-cd="h"]', box), m: $('[data-cd="m"]', box), s: $('[data-cd="s"]', box) };
    const tick = () => {
      let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60;
      els.d.textContent = String(d).padStart(2, '0'); els.h.textContent = String(h).padStart(2, '0'); els.m.textContent = String(m).padStart(2, '0'); els.s.textContent = String(s).padStart(2, '0');
    };
    tick(); setInterval(tick, 1000);
  }

  /* ======================================================================
     BATCH FILMS — Higgsfield video reels with cinematic photo fallback
     ====================================================================== */
  const REELS = [
    { imgs: ['bar-pour', 'beer', 'firefly'], subs: { da: ['Nexø, fredag aften.', 'Fadet er frisk.', 'Ingen KPI. Kun IPA.'], en: ['Nexø, Friday night.', 'The keg is fresh.', 'No KPI. Just IPA.'] } },
    { imgs: ['hug-nexo', 'sunset-drinks', 'chairs'], subs: { da: ['Salt luft.', 'Gyldne timer.', 'Skål, Nexø.'], en: ['Salt air.', 'Golden hours.', 'Cheers, Nexø.'] } },
    { imgs: ['lightstrip', 'red-woman', 'no-boring-beer'], subs: { da: ['20 haner på ølalteret.', 'Den 21. er hemmelig.', 'Er du med?'], en: ['20 taps on the beer altar.', 'The 21st is a secret.', 'Are you in?'] } }
  ];
  function initFilms() {
    const media = $('#screenMedia'), sub = $('#screenSub'), tc = $('#screenTC'), rec = $('#screenRec');
    const tabs = $$('.reel');
    const films = (C.videos && C.videos.films) || [];
    const slots = REELS.map((r, i) => {
      const f = films[i] || {};
      if (f.src && !reduced) {
        const v = document.createElement('video');
        Object.assign(v, { muted: true, playsInline: true, preload: 'none', src: f.src, poster: f.poster || '' });
        v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
        media.appendChild(v);
        return { video: v, imgs: [] };
      }
      const imgs = r.imgs.map((n) => { const im = document.createElement('img'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.src = `assets/img/${n}.avif`; media.appendChild(im); return im; });
      return { video: null, imgs };
    });
    let cur = 0, start = 0, playing = true, inView = false, elapsed = 0, lastSub = -1, lastFrame = -1;
    const DUR = 9;
    const subText = (i, k) => (REELS[i].subs[lang] || REELS[i].subs.da)[k];

    function typeSub(text) {
      if (reduced) { sub.textContent = text; return; }
      sub.textContent = '';
      let i = 0;
      const id = setInterval(() => { sub.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(id); }, 34);
    }
    function show(i) {
      cur = i; elapsed = 0; lastSub = -1; lastFrame = -1;
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); $('.bar', t).style.transform = 'scaleX(0)'; });
      rec.textContent = `Batch Film Nº 0${i + 1}`;
      $$('.is-on', media).forEach((n) => n.classList.remove('is-on'));
      slots.forEach((s, k) => { if (s.video && k !== i) s.video.pause(); });
      const s = slots[i];
      if (s.video) { s.video.currentTime = 0; s.video.classList.add('is-on'); if (inView && playing) s.video.play().catch(() => {}); }
    }
    tabs.forEach((t) => t.addEventListener('click', () => { playing = true; show(Number(t.dataset.reel)); }));
    $('#screen').addEventListener('click', () => {
      playing = !playing;
      $('#screen').dataset.cursorLabel = playing ? 'Pause' : 'Play';
      const s = slots[cur]; if (s.video) playing ? s.video.play().catch(() => {}) : s.video.pause();
    });
    $('#screen').dataset.cursorLabel = 'Pause';
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      const s = slots[cur]; if (s.video) inView && playing ? s.video.play().catch(() => {}) : s.video.pause();
    }, { threshold: 0.25 }).observe($('#screen'));
    show(0);
    renderers.push(() => { lastSub = -1; });

    tickers.add((t, dt) => {
      if (!inView) return;
      const s = slots[cur];
      const dur = s.video && s.video.duration ? s.video.duration : DUR;
      if (playing && !motionPaused) elapsed += dt;
      if (s.video && s.video.duration) elapsed = s.video.currentTime;
      const p = clamp(elapsed / dur, 0, 1);
      $('.bar', tabs[cur]).style.transform = `scaleX(${p})`;
      const k = Math.min(2, Math.floor(p * 3));
      if (!s.video && k !== lastFrame) { s.imgs.forEach((im, j) => im.classList.toggle('is-on', j === k)); lastFrame = k; }
      if (k !== lastSub) { lastSub = k; typeSub(subText(cur, k)); }
      const sec = elapsed; const ff = Math.floor((sec % 1) * 24);
      tc.textContent = `00:00:${String(Math.floor(sec)).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
      if (p >= 1 && playing && !motionPaused) show((cur + 1) % slots.length);
    });
  }

  /* ======================================================================
     EVENTS
     ====================================================================== */
  function renderEvents() {
    const list = $('#evList');
    const now = Date.now();
    const evs = (C.events || []).map((e) => ({ ...e, t: e.date ? new Date(e.date).getTime() : null }));
    const upcoming = evs.filter((e) => e.t && e.t >= now).sort((a, b) => a.t - b.t);
    const tba = evs.filter((e) => !e.t);
    const past = evs.filter((e) => e.t && e.t < now).sort((a, b) => b.t - a.t);
    const fmt = (t) => { const d = new Date(t); return { dm: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`, sub: new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'da-DK', { weekday: 'long', year: 'numeric', timeZone: 'Europe/Copenhagen' }).format(d) }; };
    const arrow = '<svg viewBox="0 0 20 20"><path d="M4 16 16 4M7 4h9v9"/></svg>';
    list.innerHTML = [...upcoming, ...tba, ...past].map((e) => {
      const isPast = e.t && e.t < now;
      const d = e.t ? fmt(e.t) : { dm: e.members ? '??.??' : T('Snart', 'Soon'), sub: e.members ? T('Afsløres for medlemmer', 'Revealed to members') : T('Følg med', 'Stay tuned') };
      const ext = /^https?:/.test(e.url || '');
      const tags = [...(e.tags || []), ...(isPast ? [T('Afholdt', 'Past')] : [])];
      return `<a class="ev${isPast ? ' is-past' : ''}${e.members ? ' is-members' : ''}" href="${e.url || '#events'}" ${ext ? 'target="_blank" rel="noopener"' : ''}>
        <div class="ev-date">${d.dm}<small>${d.sub}</small></div>
        <div class="ev-body"><h3>${L(e.title)}</h3><p>${L(e.text)}</p><div class="ev-tags">${tags.map((x) => `<span>${x}</span>`).join('')}</div></div>
        <span class="ev-cta" aria-hidden="true">${arrow}</span>
        ${e.img ? `<span class="ev-img" aria-hidden="true"><img src="${e.img}" alt="" loading="lazy"></span>` : ''}
      </a>`;
    }).join('');
  }
  renderers.push(renderEvents);

  /* ======================================================================
     MAP
     ====================================================================== */
  function initMap() {
    const grid = $('#seaGrid');
    let html = '';
    for (let x = -60; x <= 660; x += 60) html += `<line x1="${x}" y1="-30" x2="${x}" y2="705"/>`;
    for (let y = -30; y <= 705; y += 60) html += `<line x1="-60" y1="${y}" x2="660" y2="${y}"/>`;
    grid.innerHTML = html;
    $('#dirBtn').href = C.directions || '#';
    if (!hasGSAP || reduced) return;
    const coast = $('#coast');
    const len = coast.getTotalLength();
    gsap.set(coast, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(coast, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#map', start: 'top 85%', end: 'center 45%', scrub: 0.6 } });
    gsap.from('.map .town', { opacity: 0, y: 8, stagger: 0.12, scrollTrigger: { trigger: '#map', start: 'top 55%' } });
    gsap.from('.map .here', { opacity: 0, scale: 0, svgOrigin: '554.8 495', duration: 1, ease: 'back.out(3)', scrollTrigger: { trigger: '#map', start: 'top 45%' } });
  }

  /* ======================================================================
     FOOTER — sticky reveal
     ====================================================================== */
  function initFooter() {
    const footer = $('#footer'), space = $('#footerSpace');
    const fit = () => {
      footer.classList.remove('is-static');
      const h = footer.offsetHeight;
      if (reduced || h > innerHeight + 2) { footer.classList.add('is-static'); space.style.height = '0px'; }
      else space.style.height = h + 'px';
    };
    fit(); addEventListener('resize', fit);
    if (hasGSAP && !reduced) {
      gsap.fromTo('.footer-logo', { yPercent: 30, scale: 0.92 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: space, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }
  }

  /* ======================================================================
     REVEALS · SCRAMBLE LABELS · SPLIT HEADINGS
     ====================================================================== */
  function initReveals() {
    if (!hasGSAP || reduced) { document.documentElement.classList.add('reduced'); return; }
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 })
    });
    $$('[data-split]').forEach((h) => {
      h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="split-line" style="display:inline-block"><span>${w}</span></span>`).join(' ');
      gsap.from($$('.split-line > span', h), { yPercent: 110, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: h, start: 'top 88%' } });
    });
    $$('[data-scramble]').forEach((el) => onVisible(el, () => scramble(el, el.textContent, 0.8), { threshold: 1 }));
    gsap.from('.harbour-top h2, .club-title, .visit-info h2', { yPercent: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.harbour-top', start: 'top 85%' } });
  }

  /* ======================================================================
     EASTER EGGS — type "ipa" or "kpi"
     ====================================================================== */
  function initEggs() {
    let buf = '';
    addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return;
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (buf.endsWith('ipa')) { burst(innerWidth / 2, innerHeight * 0.7, 90); toast(T('Mere IPA. Altid.', 'More IPA. Always.')); buf = ''; }
      if (buf.endsWith('kpi')) { toast(T('KPI? Ikke her, kammerat.', 'KPI? Not here, mate.')); if (hasGSAP) gsap.fromTo('main', { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }); buf = ''; }
    });
  }

  /* ======================================================================
     DOOR — liquid-fill loader + age gate
     ====================================================================== */
  function initDoor(hero) {
    const door = $('#door'), pct = $('#doorPct'), gate = $('#doorGate'), liquid = $('#doorLiquid'), wave = $('#doorWave'), foam = $('#doorFoam');
    const main = $('#main'), header = $('#header');
    const verified = store.get('sb-18') === '1';
    // clipPath must contain real shapes (not <use> of a symbol)
    const clip = $('#doorClip'); clip.innerHTML = '';
    logoDs.forEach((d) => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); clip.appendChild(p); });

    main.inert = true; header.inert = true;
    if (lenis) lenis.stop();

    const heroImg = $('.hero-fallback');
    const tasks = [
      document.fonts ? document.fonts.ready : Promise.resolve(),
      heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
      new Promise((r) => setTimeout(r, reduced ? 200 : verified ? 900 : 1500))
    ];
    let done = 0, target = 0, shown = 0, finished = false, gateShown = false;
    tasks.forEach((p) => p.then(() => { done++; target = (done / tasks.length) * 100; }));
    setTimeout(() => { done = tasks.length; target = 100; }, 4000);   // never trap anyone

    let doorLast = performance.now();
    const doorTick = (t) => {
      if (finished) return;
      const now = performance.now(); const dt = Math.min(1, (now - doorLast) / 1000); doorLast = now;
      shown = Math.min(100, shown + Math.max(0, target - shown) * (1 - Math.exp(-dt * 5)) + (shown < target ? dt * 18 : 0));
      if (target < 100) shown = Math.min(shown, 96);
      pct.textContent = String(Math.round(shown)).padStart(3, '0');
      const y = LOGO_H + 20 - (shown / 100) * (LOGO_H + 60);
      liquid.setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
      const wx = -((t * 160) % 505);
      wave.setAttribute('transform', `translate(${wx.toFixed(1)} 0)`);
      foam.setAttribute('transform', `translate(${(wx * 0.7 - 120).toFixed(1)} 0)`);
      if (shown >= 99.5 && done >= tasks.length && !gateShown) {
        gateShown = true;
        if (verified) enter(); else showGate();
      }
    };
    tickers.add(doorTick);

    function showGate() {
      if (hasGSAP) gsap.to(gate, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', startAt: { y: 24 } });
      else { gate.style.opacity = 1; gate.style.visibility = 'visible'; }
      setTimeout(() => $('#doorYes').focus({ preventScroll: true }), 300);
    }
    $('#doorYes').addEventListener('click', (e) => { store.set('sb-18', '1'); burst(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2, 60); enter(); });
    $('#doorNo').addEventListener('click', () => {
      $('#doorNote').textContent = T('Kom tilbage om lidt. Vi gemmer en til dig.', "Come back in a few years. We'll save you one.");
      if (hasGSAP) gsap.fromTo('.door-actions', { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
    });

    function enter() {
      if (finished) return;
      finished = true; tickers.delete(doorTick);
      main.inert = false; header.inert = false;
      document.body.classList.remove('is-locked');
      const done = () => { door.remove(); if (lenis) lenis.start(); if (hasGSAP) ScrollTrigger.refresh(); };
      if (hasGSAP && !reduced) {
        gsap.timeline({ onComplete: done })
          .to('.door-inner, .door-brand, .door-lang, .door-foot', { y: -40, opacity: 0, duration: 0.5, ease: 'power2.in' })
          .to(door, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, 0.25)
          .add(() => hero.intro(), 0.55);
      } else { door.style.display = 'none'; done(); hero.intro(); }
    }
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  function initScroll() {
    if (!hasGSAP) return;
    if (!reduced && fine && window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
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
  initGrain();
  initScroll();
  initCursor();
  initNav();
  initPint();
  initMotionToggle();
  initHeroGL();
  const hero = initHeroMask();
  initMarquees();
  initTapGlass();
  initHarbour();
  initClub();
  initCard();
  initForm();
  initCountdown();
  initFilms();
  initMap();
  initFooter();
  initReveals();
  initMagnetic();
  initEggs();
  renderers.forEach((fn) => fn(true));
  initDoor(hero);
})();
