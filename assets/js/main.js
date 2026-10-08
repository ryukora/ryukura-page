/* Ryukura △ Solo Camp — interactions */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  /* ------------------------------------------------------------------ *
   * Intro — pitching the tent
   * ------------------------------------------------------------------ */
  function runIntro(onDone) {
    const intro = $('#intro');
    if (!intro || root.classList.contains('no-intro')) {
      if (intro) intro.remove();
      onDone();
      return;
    }
    const log = $('#introLog');
    const lines = ['checking the weather…', 'packing the scarf…', 'pitching the tent…', 'booting proxmox…', 'lighting the campfire…', 'ready. ようこそ。'];
    let i = 0;
    let finished = false;
    const tick = setInterval(() => { i = Math.min(i + 1, lines.length - 1); log.textContent = lines[i]; }, 360);

    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      clearTimeout(timer);
      log.textContent = lines[lines.length - 1];
      store.set('rk-intro', '1');
      intro.classList.add('is-done');
      removeEventListener('keydown', onKey);
      setTimeout(onDone, 250);
      setTimeout(() => intro.remove(), 1300);
    };
    const onKey = (e) => { if (['Enter', 'Escape', ' '].includes(e.key)) finish(); };
    const timer = setTimeout(finish, 2400);
    intro.addEventListener('click', finish);
    addEventListener('keydown', onKey);
  }

  /* ------------------------------------------------------------------ *
   * Clock, age, year
   * ------------------------------------------------------------------ */
  function initClock() {
    const clock = $('#clock');
    const mood = $('#clockMood');
    if (!clock) return;
    let fmt, hourFmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: 'numeric', hourCycle: 'h23' });
    } catch (e) { return; }
    const update = () => {
      const now = new Date();
      clock.textContent = fmt.format(now);
      clock.dateTime = now.toISOString();
      const h = parseInt(hourFmt.format(now), 10) % 24;
      mood.textContent = h < 5 ? 'probably debugging'
        : h < 10 ? 'morning coffee'
        : h < 16 ? 'out in the field'
        : h < 19 ? 'golden hour'
        : 'campfire hours';
    };
    update();
    setInterval(update, 15000);
  }

  function initAge() {
    const el = $('#birthday');
    const [y, m, d] = (el && el.dataset.date || '2007-05-09').split('-').map(Number);
    const now = new Date();
    let age = now.getFullYear() - y;
    if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
    $$('#age, #ageStat').forEach((n) => { n.textContent = age; });
    const year = $('#year');
    if (year) year.textContent = now.getFullYear();
  }

  /* ------------------------------------------------------------------ *
   * Navigation
   * ------------------------------------------------------------------ */
  function initNav() {
    const nav = $('#nav');
    const btn = $('#menuBtn');
    const menu = $('#mobileMenu');

    const setMenu = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      root.classList.toggle('menu-open', open);
    };
    btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

    // active section
    const links = $$('.nav-links a');
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-active'));
        const a = byId.get(en.target.id);
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['hero', 'basecamp', 'loadout', 'trail', 'rin', 'signals'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });

    return (y) => nav.classList.toggle('is-scrolled', y > 30);
  }

  /* ------------------------------------------------------------------ *
   * Starfield — twinkling sky + shooting-star "packets"
   * ------------------------------------------------------------------ */
  function Starfield(canvas) {
    const ctx = canvas.getContext('2d');
    const labels = [
      ['DNS', 'nijika.ryukura.biz.id'], ['ICMPv6', 'echo → ::1'], ['DoT', ':853 handshake'], ['AAAA', 'bebasid.com'],
      ['SCRAPE', 'prometheus · 15s'], ['PKT', 'from depok'], ['DoH', 'dns-query · 1 rtt'], ['ALERT', 'resolved ✓'],
      ['WG', 'keepalive'], ['NTP', 'sync ok'], ['QUIC', 'dns.ryukura.biz.id'], ['ARP', 'who-has 10.0.0.1'],
    ];
    let w = 0, h = 0, dpr = 1, stars = [], meteors = [];
    let night = 0, mx = 0, my = 0, scroll = 0, last = 0, nextMeteor = 1800, running = true, raf = 0;

    function makeStar() {
      const z = Math.random();
      return {
        x: Math.random() * w, y: Math.random() * h,
        r: .25 + z * z * 1.35, a: .25 + Math.random() * .75,
        s: .3 + Math.random() * 2, ph: Math.random() * Math.PI * 2, z,
        warm: Math.random() < .1, glint: z > .965,
      };
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(460, Math.round((w * h) / 3800));
      stars = Array.from({ length: n }, makeStar);
      if (reduced) draw(0);
    }
    function spawn() {
      const dir = Math.random() < .5 ? 1 : -1;
      const ang = (Math.PI / 7) + Math.random() * (Math.PI / 8);
      const speed = .5 + Math.random() * .45; // px / ms
      const tracked = Math.random() < .45;
      meteors.push({
        x: w * (.15 + Math.random() * .7), y: h * (Math.random() * .4),
        vx: Math.cos(ang) * speed * dir, vy: Math.sin(ang) * speed,
        len: 120 + Math.random() * 140, life: 0, max: 900 + Math.random() * 700,
        label: tracked ? labels[(Math.random() * labels.length) | 0] : null,
      });
    }
    function drawStar(s, t) {
      const tw = .55 + .45 * Math.sin(t * .001 * s.s + s.ph);
      let x = s.x - mx * s.z * 22;
      let y = (s.y - scroll * .04 * (s.z + .2)) % h;
      if (y < 0) y += h;
      x = ((x % w) + w) % w;
      y -= my * s.z * 14;
      const alpha = s.a * tw * (.3 + night * .7);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.warm ? '#ffdcae' : '#e1e7ff';
      if (s.r < .7) { ctx.fillRect(x, y, s.r * 1.6, s.r * 1.6); return; }
      ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.2832); ctx.fill();
      if (s.glint) {
        ctx.globalAlpha = alpha * .55;
        ctx.fillRect(x - 5 * tw, y - .4, 10 * tw, .8);
        ctx.fillRect(x - .4, y - 5 * tw, .8, 10 * tw);
      }
    }
    function drawMeteor(m, dt) {
      m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt;
      const p = m.life / m.max;
      const fade = p < .15 ? p / .15 : 1 - Math.max(0, (p - .55) / .45);
      const sp = Math.hypot(m.vx, m.vy);
      const tx = m.x - (m.vx / sp) * m.len, ty = m.y - (m.vy / sp) * m.len;
      const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, `rgba(255,236,200,${.95 * fade})`);
      g.addColorStop(.25, `rgba(255,170,110,${.45 * fade})`);
      g.addColorStop(1, 'rgba(180,150,255,0)');
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = `rgba(255,245,225,${fade})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, 1.8, 0, 6.2832); ctx.fill();

      if (m.label && fade > .05) {
        const s = 9, c = 4;
        ctx.globalAlpha = fade * .95;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        ctx.beginPath();
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
          const cx = m.x + sx * s, cy = m.y + sy * s;
          ctx.moveTo(cx, cy - sy * c); ctx.lineTo(cx, cy); ctx.lineTo(cx - sx * c, cy);
        });
        const lx = m.x + (m.vx > 0 ? -16 : 16), ly = m.y - 22;
        ctx.moveTo(m.x + (m.vx > 0 ? -s : s), m.y - s); ctx.lineTo(lx, ly);
        ctx.stroke();
        ctx.font = '700 10px "JetBrains Mono", monospace';
        const t1 = m.label[0], t2 = ' ' + m.label[1];
        ctx.font = '700 10px "JetBrains Mono", monospace';
        const w1 = ctx.measureText(t1).width;
        ctx.font = '500 10px "JetBrains Mono", monospace';
        const w2 = ctx.measureText(t2).width;
        const bw = w1 + w2 + 14, bx = m.vx > 0 ? lx - bw : lx, by = ly - 16;
        ctx.fillStyle = 'rgba(6,9,28,.6)'; ctx.fillRect(bx, by, bw, 18);
        ctx.fillStyle = '#ff9a3d'; ctx.fillRect(m.vx > 0 ? bx + bw - 2 : bx, by, 2, 18);
        ctx.fillStyle = '#ffffff'; ctx.font = '700 10px "JetBrains Mono", monospace'; ctx.fillText(t1, bx + 7, by + 12.5);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '500 10px "JetBrains Mono", monospace'; ctx.fillText(t2, bx + 7 + w1, by + 12.5);
      }
      return m.life < m.max;
    }
    function draw(t) {
      const dt = Math.min(50, t - last || 16);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < stars.length; i++) drawStar(stars[i], t);
      if (!reduced) {
        nextMeteor -= dt;
        if (nextMeteor <= 0 && night > .2) { spawn(); nextMeteor = 1800 + Math.random() * 4200; }
        meteors = meteors.filter((m) => drawMeteor(m, dt));
      }
      ctx.globalAlpha = 1;
    }
    function loop(t) {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    }
    resize();
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      if (reduced) return;
      running = !document.hidden;
      if (running) { last = performance.now(); raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf);
    });
    if (!reduced) raf = requestAnimationFrame(loop);

    return {
      set(n, sy, x, y) { night = n; scroll = sy; mx = x; my = y; if (reduced) draw(0); },
      burst(n = 6) { for (let i = 0; i < n; i++) setTimeout(spawn, i * 140); },
    };
  }

  /* ------------------------------------------------------------------ *
   * Embers rising from the pixel campfire
   * ------------------------------------------------------------------ */
  function Embers(canvas, emitter, section) {
    const ctx = canvas.getContext('2d');
    const colors = ['#ffe08a', '#ffc46b', '#ff9a3d', '#ff6a3d'];
    let w = 0, h = 0, dpr = 1, parts = [], active = false, raf = 0, last = 0, intensity = 1, px = 3;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const img = $('img', emitter.parentElement);
      px = img ? Math.max(2, Math.round(img.getBoundingClientRect().width / 480)) : 3;
    }
    function origin() {
      const c = canvas.getBoundingClientRect(), e = emitter.getBoundingClientRect();
      return [e.left - c.left, e.top - c.top];
    }
    function frame(t) {
      if (!active) return;
      const dt = Math.min(50, t - last || 16) / 16;
      last = t;
      const [ox, oy] = origin();
      const want = 70 * intensity;
      if (parts.length < want && Math.random() < .5 * intensity) {
        parts.push({
          x: ox + (Math.random() - .5) * px * 8, y: oy - px * 2,
          vx: (Math.random() - .5) * .5, vy: -(.6 + Math.random() * 1.2) * (intensity > 1 ? 1.25 : 1),
          life: 0, max: 90 + Math.random() * 140, seed: Math.random() * 10,
          c: colors[(Math.random() * colors.length) | 0], s: Math.random() < .25 ? 2 : 1,
        });
      }
      ctx.clearRect(0, 0, w, h);
      parts = parts.filter((p) => {
        p.life += dt;
        p.vx += Math.sin(t * .002 + p.seed) * .012 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const k = p.life / p.max;
        if (k >= 1) return false;
        ctx.globalAlpha = (k < .1 ? k / .1 : 1 - k) * .95;
        ctx.fillStyle = p.c;
        const s = px * p.s;
        ctx.fillRect(Math.round(p.x / px) * px, Math.round(p.y / px) * px, s, s);
        return true;
      });
      raf = requestAnimationFrame(frame);
    }
    resize();
    addEventListener('resize', resize);
    new IntersectionObserver(([en]) => {
      const on = en.isIntersecting && !reduced;
      if (on && !active) { active = true; resize(); last = performance.now(); raf = requestAnimationFrame(frame); }
      if (!on) { active = false; cancelAnimationFrame(raf); }
    }, { threshold: 0 }).observe(section);
    return { setIntensity(v) { intensity = v; } };
  }

  /* ------------------------------------------------------------------ *
   * Campfire ambience — fully procedural Web Audio (no files)
   * ------------------------------------------------------------------ */
  function Ambience() {
    let ctx = null, master = null, crackleTimer = 0, on = false;

    function noiseBuffer(seconds, type) {
      const len = Math.round(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown') { last = (last + .02 * white) / 1.02; d[i] = last * 3.2; } else d[i] = white;
      }
      return buf;
    }
    function build() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);

      // low rumble of the fire
      const rumble = ctx.createBufferSource(); rumble.buffer = noiseBuffer(6, 'brown'); rumble.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      const rg = ctx.createGain(); rg.gain.value = .55;
      rumble.connect(lp).connect(rg).connect(master); rumble.start();

      // soft wind over the lake
      const wind = ctx.createBufferSource(); wind.buffer = noiseBuffer(8, 'white'); wind.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .7;
      const wg = ctx.createGain(); wg.gain.value = .045;
      const lfo = ctx.createOscillator(); lfo.frequency.value = .07;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 260;
      lfo.connect(lfoGain).connect(bp.frequency); lfo.start();
      const lfo2 = ctx.createOscillator(); lfo2.frequency.value = .11;
      const lfo2Gain = ctx.createGain(); lfo2Gain.gain.value = .025;
      lfo2.connect(lfo2Gain).connect(wg.gain); lfo2.start();
      wind.connect(bp).connect(wg).connect(master); wind.start();

      ctx.clickBuf = noiseBuffer(.2, 'white');
    }
    function crackle() {
      if (!on) return;
      const t = ctx.currentTime;
      const pops = Math.random() < .25 ? 2 + ((Math.random() * 3) | 0) : 1;
      for (let i = 0; i < pops; i++) {
        const at = t + i * (.012 + Math.random() * .04);
        const src = ctx.createBufferSource(); src.buffer = ctx.clickBuf;
        const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1200 + Math.random() * 4200; hp.Q.value = 1.2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(.0001, at);
        g.gain.exponentialRampToValueAtTime(.18 + Math.random() * .5, at + .002);
        g.gain.exponentialRampToValueAtTime(.0001, at + .02 + Math.random() * .07);
        src.connect(hp).connect(g).connect(master);
        src.start(at, Math.random() * .1); src.stop(at + .12);
      }
      crackleTimer = setTimeout(crackle, Math.random() < .3 ? 40 + Math.random() * 120 : 160 + Math.random() * 700);
    }
    return {
      async toggle() {
        on = !on;
        if (on) {
          if (!ctx) build();
          if (ctx.state === 'suspended') await ctx.resume();
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setTargetAtTime(.7, ctx.currentTime, .6);
          crackle();
        } else if (ctx) {
          clearTimeout(crackleTimer);
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setTargetAtTime(0, ctx.currentTime, .25);
          setTimeout(() => { if (!on && ctx) ctx.suspend(); }, 1500);
        }
        return on;
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Reveal on scroll + gear pips + HUD scenes
   * ------------------------------------------------------------------ */
  function initReveal() {
    $$('.gear').forEach((g) => {
      const level = +g.dataset.level || 0;
      const pips = $('.pips', g);
      for (let i = 0; i < 10; i++) {
        const p = document.createElement('i');
        if (i < level) { p.className = 'on'; p.style.setProperty('--i', i); }
        pips.appendChild(p);
      }
    });
    const els = $$('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
    els.forEach((e) => io.observe(e));

    const night = $('#night');
    if (night) {
      new IntersectionObserver(([en]) => { if (en.isIntersecting) night.classList.add('hud-on'); }, { threshold: .35 }).observe(night);
    }
  }

  function initNightImage() {
    const img = $('#nightImg');
    if (!img || reduced) return;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const pre = new Image();
      pre.onload = () => { img.src = pre.src; };
      pre.src = img.dataset.anim;
    }, { rootMargin: '900px 0px' });
    io.observe(img);
  }

  /* ------------------------------------------------------------------ *
   * Spotlight on cards
   * ------------------------------------------------------------------ */
  function initSpotlight() {
    if (!finePointer) return;
    $$('.gear, .site-card').forEach((card) => {
      card.classList.add('spot');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Copy buttons + GitHub stars
   * ------------------------------------------------------------------ */
  function initCopy() {
    $$('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        let ok = false;
        try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
          const ta = document.createElement('textarea');
          ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
          ta.remove();
        }
        btn.textContent = ok ? 'Copied ✓' : 'Press ⌘C';
        btn.classList.toggle('is-done', ok);
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1800);
      });
    });
  }

  function initStars() {
    const badges = $$('[data-repo]');
    if (!badges.length) return;
    const nf = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      badges.forEach((b) => {
        fetch(`https://api.github.com/repos/${b.dataset.repo}`, { headers: { Accept: 'application/vnd.github+json' } })
          .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
          .then((d) => {
            if (typeof d.stargazers_count !== 'number') return;
            $('b', b).textContent = nf.format(d.stargazers_count);
            b.title = `${d.stargazers_count} stars on GitHub`;
            b.hidden = false;
          })
          .catch(() => { /* stays hidden */ });
      });
    }, { rootMargin: '400px 0px' });
    io.observe($('#trail'));
  }

  /* ------------------------------------------------------------------ *
   * Lightbox
   * ------------------------------------------------------------------ */
  function initLightbox() {
    const lb = $('#lightbox');
    if (!lb || typeof lb.showModal !== 'function') return;
    const img = $('#lbImg'), cap = $('#lbCap');
    const items = $$('#gallery .g');
    let cur = 0;
    const show = (i) => {
      cur = (i + items.length) % items.length;
      const src = $('img', items[cur]);
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      img.classList.toggle('pixel', src.classList.contains('pixel'));
      cap.replaceChildren(...Array.from($('figcaption', items[cur]).cloneNode(true).childNodes));
    };
    items.forEach((f, i) => $('.g-btn', f).addEventListener('click', () => { show(i); lb.showModal(); }));
    lb.addEventListener('click', (e) => {
      const action = e.target.closest('[data-lb]');
      if (action) {
        const a = action.dataset.lb;
        if (a === 'close') lb.close();
        else show(cur + (a === 'next' ? 1 : -1));
      } else if (e.target === lb) lb.close();
    });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  /* ------------------------------------------------------------------ *
   * Rin peeks in at the end
   * ------------------------------------------------------------------ */
  function initPeek() {
    const peek = $('#peek');
    const signals = $('#signals');
    if (!peek || !signals) return;
    let gone = false, talkTimer = 0;
    const bubble = $('.peek-bubble', peek);
    const io = new IntersectionObserver(([en]) => {
      if (gone) return;
      if (en.isIntersecting) {
        peek.classList.add('is-in');
        clearTimeout(talkTimer);
        talkTimer = setTimeout(() => peek.classList.add('is-talking'), 900);
      } else {
        peek.classList.remove('is-in', 'is-talking');
        clearTimeout(talkTimer);
      }
    }, { threshold: .3 });
    io.observe(signals);
    $('img', peek).addEventListener('click', () => {
      bubble.textContent = 'またね！';
      peek.classList.add('is-talking', 'is-shy');
      setTimeout(() => { gone = true; peek.classList.remove('is-in', 'is-talking', 'is-shy'); }, 1400);
    });
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  initAge();
  initClock();
  const navScrolled = initNav();
  initReveal();
  initNightImage();
  initSpotlight();
  initCopy();
  initStars();
  initLightbox();
  initPeek();

  const sky = Starfield($('#stars'));
  const embers = Embers($('#embers'), $('#emitter'), $('#signals'));

  // ambience: nav button + chibi share one state
  const amb = Ambience();
  const ambBtn = $('#ambience');
  const setLit = (on) => {
    ambBtn.setAttribute('aria-pressed', String(on));
    root.classList.toggle('is-lit', on);
    embers.setIntensity(on ? 1.9 : 1);
    $('#chibi').setAttribute('aria-label', on ? 'Let the campfire rest (turns ambience sound off)' : 'Light the campfire (turns ambience sound on)');
  };
  const toggleAmb = async () => {
    try { setLit(await amb.toggle()); } catch (e) { setLit(false); }
  };
  ambBtn.addEventListener('click', toggleAmb);
  $('#chibi').addEventListener('click', async () => {
    await toggleAmb();
    if (root.classList.contains('is-lit')) sky.burst(4);
  });

  // scroll + pointer driven scene
  const hero = $('#hero'), heroBox = $('#heroBox'), heroContent = $('#heroContent'), nightfall = $('#nightfall');
  const progress = $('#progress'), route = $('#route');
  let mx = 0, my = 0, ticking = false;

  function update() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    const max = root.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? clamp(y / max) : 0})`;
    navScrolled(y);

    const hh = hero.offsetHeight;
    const p = clamp(y / hh);
    if (y < hh * 1.1) {
      if (!reduced) {
        heroBox.style.transform = `translate3d(${(mx * -16).toFixed(2)}px, ${(y * .32 + my * -10).toFixed(2)}px, 0) scale(${(1.06 + p * .06).toFixed(4)})`;
        heroContent.style.transform = `translate3d(0, ${(y * -.14).toFixed(2)}px, 0)`;
      }
      heroContent.style.opacity = String(clamp(1 - p * 1.4));
      nightfall.style.opacity = String(clamp(p * 1.2));
    }
    sky.set(clamp(.25 + p * 1.2), y, mx, my);

    if (route) {
      const r = route.getBoundingClientRect();
      route.style.setProperty('--p', clamp((vh * .62 - r.top) / r.height).toFixed(4));
    }
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  if (finePointer && !reduced) {
    addEventListener('pointermove', (e) => {
      mx = e.clientX / innerWidth - .5;
      my = e.clientY / innerHeight - .5;
      request();
    }, { passive: true });
  }
  update();

  // little secret: click the △ five times for a meteor shower
  let taps = 0, tapTimer = 0;
  $('.brand').addEventListener('click', () => {
    taps++; clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1200);
    if (taps >= 5) { taps = 0; sky.burst(14); }
  });

  runIntro(() => {
    root.classList.add('is-ready');
    hero.classList.add('hud-on');
  });
})();
