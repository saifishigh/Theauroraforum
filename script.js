/* ============================================================
   THE AURORA FORUM — SCRIPT v12
   - Added email field to Standard registration
   - Robust in-app / Instagram browser detection
   - Safe initialization — one failure never cascades
   - WebView-safe copy fallback
   ============================================================ */

(function ensureBrowserFlags() {
  try {
    if (window.__auroraBrowser) return;
    var ua = navigator.userAgent || '';
    var isInApp = /FBAN|FBAV|FB_IAB|Instagram|Messenger|KAKAOTALK|Line\/|SnapChat|Twitter|LinkedIn|Pinterest/i.test(ua)
                || (/Android/i.test(ua) && /;\s*wv\)/i.test(ua))
                || (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua));
    var isInstagram = /Instagram/i.test(ua);
    var h = document.documentElement;
    if (isInApp) h.classList.add('in-app-browser');
    if (isInstagram) h.classList.add('instagram-browser');
    window.__auroraBrowser = { isInApp: isInApp, isInstagram: isInstagram };
  } catch (e) {}
})();

const BROWSER = window.__auroraBrowser || { isInApp: false, isInstagram: false };

const state = { currentPage: 'front', transitioning: false };
const pages = ['front', 'about', 'tafmun', 'events', 'contact'];

const TAFMUN_CONFIG = {
  fee: 2200,
  specialFee: 2400,
  bankAccount: {
    accountTitle: "Rizwan Haider",
    bank: "Soneri Bank",
    accountNumber: "20004814507"
  },
  committees: [
    "United Nations Security Council",
    "United Nations Commission on the Status of Women",
    "United Nations Economic and Financial Committee",
    "Pakistan National Assembly"
  ]
};

let veil, dock, main;

function safeInit(name, fn) {
  try {
    if (typeof fn === 'function') fn();
  } catch (err) {
    console.warn('[Aurora] init failed:', name, err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  veil = document.getElementById('veil');
  dock = document.getElementById('dock');
  main = document.getElementById('main');

  safeInit('dates',              setDates);
  safeInit('scrollReveal',       initScrollReveal);
  safeInit('keyboard',           initKeyboard);
  safeInit('swipe',              initSwipe);
  safeInit('dockHover',          initDockHover);
  safeInit('scrollHide',         initScrollHide);
  safeInit('pageEnterEffects',   initPageEnterEffects);
  safeInit('tiltCards',          initTiltCards);
  safeInit('counters',           initCounters);
  safeInit('typewriter',         initTypewriter);
  safeInit('memberFlip',         initMemberFlip);
  safeInit('eventHover',         initEventHover);
  safeInit('contactFx',          initContactFx);
  safeInit('instagramDetection', initInstagramDetection);
  safeInit('bankDetails',        initTAFMUNBankDetails);
  safeInit('standardInit',       initTAFMUNStandard);
  safeInit('specialInit',        initTAFMUNSpecial);
  safeInit('copyTaf',            () => initCopyButton('taf-copy-account'));
  safeInit('copyTsf',            () => initCopyButton('tsf-copy-account'));

  if (!BROWSER.isInApp) {
    safeInit('parallaxLogo',  initParallaxLogo);
    safeInit('cursorTrail',   initCursorTrail);
    safeInit('heroParticles', initHeroParticles);
  } else {
    const logoImg = document.querySelector('.logo-bg img');
    if (logoImg) logoImg.style.animation = 'none';
  }

  if (veil) veil.classList.remove('covering');
});

/* ── DATES ── */
function setDates() {
  const now  = new Date();
  const long = now.toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const mon  = now.toLocaleDateString('en-GB', { month:'long', year:'numeric' });
  const yr   = now.getFullYear();
  const set  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('sidebar-date', long);
  set('hero-date',    long);
  set('footer-year',  yr);
  set('footer-date',  mon);
}

/* ── NAVIGATE ── */
function navigate(pageId) {
  if (state.currentPage === pageId || state.transitioning) return;
  state.transitioning = true;

  try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}

  const btn = dock ? dock.querySelector('[data-page="' + pageId + '"]') : null;
  if (btn) {
    btn.classList.remove('bounce');
    void btn.offsetWidth;
    btn.classList.add('bounce');
    btn.addEventListener('animationend', () => btn.classList.remove('bounce'), { once: true });
  }

  const logo = document.querySelector('.logo-bg img');
  if (logo) {
    logo.classList.add('logo-pulse');
    setTimeout(() => logo.classList.remove('logo-pulse'), 700);
  }

  if (veil) veil.classList.add('covering');

  setTimeout(() => {
    try {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + pageId);
      if (target) target.classList.add('active');
      state.currentPage = pageId;

      if (pageId === 'tafmun') resetTAFMUNLanding();

      document.querySelectorAll('[data-page]').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
      });

      initScrollReveal();
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err) {
      console.warn('[Aurora] navigate error:', err);
    } finally {
      if (veil) veil.classList.remove('covering');
      setTimeout(() => { state.transitioning = false; }, 280);
    }
  }, 240);
}
window.navigate = navigate;

/* ── DOCK HOVER ── */
function initDockHover() {
  if (!dock) return;
  if (BROWSER.isInApp) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;
  const shell = dock.querySelector('.dock-shell');
  const btns  = dock.querySelectorAll('.dock-btn');
  if (!shell || !btns.length) return;

  shell.addEventListener('mousemove', e => {
    const sr = shell.getBoundingClientRect();
    const mx = e.clientX - sr.left;
    btns.forEach(btn => {
      const br  = btn.getBoundingClientRect();
      const bx  = (br.left + br.width / 2) - sr.left;
      const dist = Math.abs(mx - bx);
      const max  = 80;
      if (dist < max) {
        const str = (1 - dist / max);
        const dx  = (mx - bx) * str * 0.22;
        const sc  = 1 + str * 0.2;
        const dy  = str * 6;
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${-dy.toFixed(1)}px) scale(${sc.toFixed(3)})`;
        btn.style.zIndex    = '2';
        const icon = btn.querySelector('.dock-icon');
        if (icon) icon.style.color = str > 0.5 ? 'var(--gold)' : '';
      } else {
        btn.style.transform = '';
        btn.style.zIndex    = '';
        const icon = btn.querySelector('.dock-icon');
        if (icon) icon.style.color = '';
      }
    });
  });

  shell.addEventListener('mouseleave', () => {
    btns.forEach(btn => {
      btn.style.transform = '';
      btn.style.zIndex    = '';
      const icon = btn.querySelector('.dock-icon');
      if (icon) icon.style.color = '';
    });
  });
}

/* ── DOCK SCROLL HIDE ── */
function initScrollHide() {
  if (!dock) return;
  if (BROWSER.isInApp) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;

  dock.style.transition = 'transform 0.45s cubic-bezier(0.34,1.4,0.64,1), opacity 0.3s ease';
  let lastY = 0, ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y    = window.scrollY;
      const diff = y - lastY;
      if (diff > 55 && y > 180) {
        dock.style.transform     = 'translateY(110%)';
        dock.style.opacity       = '0';
        dock.style.pointerEvents = 'none';
      } else if (diff < -15 || y < 80) {
        dock.style.transform     = '';
        dock.style.opacity       = '';
        dock.style.pointerEvents = '';
      }
      lastY = y;
      ticking = false;
    });
  }, { passive: true });
}

/* ── SWIPE ── */
function initSwipe() {
  if (!main) return;
  let sx = 0, sy = 0, st = 0;
  main.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    st = Date.now();
  }, { passive: true });
  main.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    const dt = Date.now() - st;
    if (Math.abs(dx) < 52 || Math.abs(dy) > Math.abs(dx) * 0.75 || dt > 420) return;
    const idx = pages.indexOf(state.currentPage);
    if (dx < -52 && idx < pages.length - 1) navigate(pages[idx + 1]);
    else if (dx > 52 && idx > 0)            navigate(pages[idx - 1]);
  }, { passive: true });
}

/* ── KEYBOARD ── */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    const idx = pages.indexOf(state.currentPage);
    if (e.key === 'ArrowRight' && idx < pages.length - 1) navigate(pages[idx + 1]);
    if (e.key === 'ArrowLeft'  && idx > 0)                navigate(pages[idx - 1]);
  });
}

/* ── SCROLL REVEAL ── */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = Array.from(entry.target.parentElement?.querySelectorAll('.reveal') || []);
      const delay    = siblings.indexOf(entry.target) * 75;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -28px 0px' });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}

/* ── LOGO PARALLAX ── */
function initParallaxLogo() {
  const logo = document.querySelector('.logo-bg');
  if (!logo) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;
  const img = logo.querySelector('img');
  if (img) img.style.animation = 'none';
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  document.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    targetX = ((e.clientX - cx) / cx) * 8;
    targetY = ((e.clientY - cy) / cy) * 6;
  }, { passive: true });
  function tick() {
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;
    logo.style.transform = `translate(calc(-50% + ${currentX.toFixed(2)}px), calc(-50% + ${currentY.toFixed(2)}px))`;
    requestAnimationFrame(tick);
  }
  tick();
}

/* ── PAGE ENTER STAGGER ── */
function initPageEnterEffects() {
  if (!('MutationObserver' in window)) return;
  const obs = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.target.querySelectorAll && staggerChildren(m.target);
    });
  });
  document.querySelectorAll('.page').forEach(pg => {
    obs.observe(pg, { attributes: true, attributeFilter: ['class'] });
  });
}
function staggerChildren(page) {
  if (!page.classList.contains('active')) return;
  const kids = page.querySelectorAll('.pg-head, .hero-kicker, .hero-hed, .hero-dek, .lead-main, .lead-aside, .cp-card, .pl, .sec-card, .ev, .teaser-btn');
  kids.forEach((el, i) => {
    el.style.animationDelay = (i * 45) + 'ms';
  });
}

/* ── CONTACT FORM ── */
function submitForm(btn) {
  const form   = btn.closest('.cform');
  const inputs = form.querySelectorAll('input, textarea');
  let valid    = true;
  inputs.forEach(inp => {
    if (!inp.value.trim()) {
      inp.style.borderBottomColor = '#8b1a1a';
      inp.setAttribute('aria-invalid', 'true');
      valid = false;
    } else {
      inp.style.borderBottomColor = '';
      inp.removeAttribute('aria-invalid');
    }
  });
  if (!valid) {
    const orig = btn.textContent;
    btn.textContent = 'Please fill all fields';
    btn.style.cssText = 'border-color:#8b1a1a;color:#8b1a1a;';
    setTimeout(() => { btn.textContent = orig; btn.style.cssText = ''; }, 2200);
    const bad = form.querySelector('[aria-invalid="true"]');
    if (bad && bad.focus) bad.focus();
    return;
  }
  btn.textContent = 'Message Dispatched ✦';
  btn.style.cssText = 'background:rgba(200,168,75,0.1);border-color:#c8a84b;color:#c8a84b;';
  btn.disabled = true;
  inputs.forEach(inp => { inp.style.opacity = '0.45'; inp.disabled = true; });
}

/* ── CURSOR TRAIL ── */
function initCursorTrail() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });
  const particles = [];
  let mx = -999, my = -999;
  let moving = false, moveTimer = null;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    moving = true;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => { moving = false; }, 80);
  }, { passive: true });
  function spawnParticle() {
    if (!moving || mx < 0) return;
    particles.push({
      x: mx + (Math.random()-0.5)*6,
      y: my + (Math.random()-0.5)*6,
      vx: (Math.random()-0.5)*0.6,
      vy: (Math.random()-0.7)*0.9,
      life: 1,
      decay: 0.035 + Math.random()*0.02,
      size: 1.2 + Math.random()*1.4,
      hue: 275 + (Math.random()-0.5)*20
    });
  }
  let frameCount = 0;
  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    frameCount++;
    if (frameCount % 3 === 0) spawnParticle();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.life * 0.4;
      ctx.fillStyle = `hsl(${p.hue},65%,68%)`;
      ctx.shadowColor = `hsl(${p.hue},80%,55%)`;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  loop();
}

/* ── HERO PARTICLES ── */
function initHeroParticles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;width:100%;height:100%;';
  hero.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = hero.offsetWidth; H = canvas.height = hero.offsetHeight; }
  resize();
  const dots = Array.from({length: 55}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    vx: (Math.random()-0.5)*0.22, vy: (Math.random()-0.5)*0.18,
    r: 0.6 + Math.random()*1.4,
    opacity: 0.1 + Math.random()*0.35
  }));
  let mouseX = W/2, mouseY = H/2;
  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0,0,W,H);
    dots.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      if (d.x<0) d.x=W; if (d.x>W) d.x=0;
      if (d.y<0) d.y=H; if (d.y>H) d.y=0;
      const dx = d.x - mouseX, dy = d.y - mouseY;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 100) {
        d.vx += dx/dist * 0.04;
        d.vy += dy/dist * 0.04;
        const speed = Math.sqrt(d.vx*d.vx+d.vy*d.vy);
        if (speed > 1.2) { d.vx *= 0.8; d.vy *= 0.8; }
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(140,80,220,${d.opacity})`;
      ctx.fill();
    });
    for (let i=0; i<dots.length; i++) {
      for (let j=i+1; j<dots.length; j++) {
        const dx = dots[i].x-dots[j].x, dy = dots[i].y-dots[j].y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(120,60,200,${0.08*(1-dist/120)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }
  draw();
  window.addEventListener('resize', resize);
}

/* ── TILT CARDS ── */
function initTiltCards() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  if (BROWSER.isInApp) return;
  const cards = document.querySelectorAll('.cp-card, .pl, .sec-card, .ci-member-card, .ev');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${-y*6}deg) rotateY(${x*6}deg) translateY(-3px)`;
      card.style.transition = 'transform 0.05s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.45s cubic-bezier(0.22,1,0.36,1)';
    });
  });
}

/* ── COUNTERS ── */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => { el.textContent = el.dataset.count; });
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      const duration = 1800;
      const start = performance.now();
      function tick(now) {
        const t = Math.min((now-start)/duration, 1);
        const ease = 1 - Math.pow(1-t, 3);
        el.textContent = Math.round(ease * target);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}

/* ── TYPEWRITER ── */
function initTypewriter() {
  const el = document.querySelector('.hero-dek');
  if (!el) return;
  if (BROWSER.isInApp) return;
  const phrases = [
    'A generation prepares to make itself heard on the world stage',
    'Leadership forged through debate and dialogue',
    'Youth voices shaping the future of global discourse',
    'Where ambition meets articulation'
  ];
  let idx = 0, charIdx = 0, deleting = false;
  el.innerHTML = '<span class="tw-text"></span><span class="tw-cursor">|</span>';
  const tw = el.querySelector('.tw-text');
  function type() {
    const phrase = phrases[idx];
    if (!deleting) {
      tw.textContent = phrase.slice(0, ++charIdx);
      if (charIdx === phrase.length) { deleting = true; setTimeout(type, 2800); return; }
      setTimeout(type, 38);
    } else {
      tw.textContent = phrase.slice(0, --charIdx);
      if (charIdx === 0) { deleting = false; idx = (idx+1)%phrases.length; setTimeout(type, 400); return; }
      setTimeout(type, 18);
    }
  }
  setTimeout(type, 1200);
}

/* ── MEMBER FLIP ── */
function initMemberFlip() {
  const cards = document.querySelectorAll('.sec-card');
  cards.forEach(card => {
    card.style.cursor = 'pointer';
    card.setAttribute('title', 'Click to flip');
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
}

/* ── EVENT RIPPLE ── */
function initEventHover() {
  document.querySelectorAll('.ev').forEach(ev => {
    ev.addEventListener('click', e => {
      const ripple = document.createElement('span');
      ripple.className = 'ev-ripple';
      const r = ev.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2;
      ripple.style.cssText = `
        position:absolute;border-radius:50%;
        width:${size}px;height:${size}px;
        left:${e.clientX - r.left - size/2}px;
        top:${e.clientY - r.top - size/2}px;
        background:rgba(120,60,200,0.12);
        transform:scale(0);
        animation:rippleAnim 0.6s ease-out forwards;
        pointer-events:none;
      `;
      ev.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });
}

/* ── CONTACT FX ── */
function initContactFx() {
  document.querySelectorAll('.cf-field input, .cf-field textarea').forEach(input => {
    input.addEventListener('focus', () => {
      const field = input.closest('.cf-field');
      if (!field) return;
      field.classList.add('cf-active');
    });
    input.addEventListener('blur', () => {
      const field = input.closest('.cf-field');
      if (!field) return;
      if (!input.value) field.classList.remove('cf-active');
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   IN-APP BROWSER BANNER
   ════════════════════════════════════════════════════════════════ */
function initInstagramDetection() {
  if (BROWSER.isInApp) {
    const banner = document.getElementById('ig-banner');
    if (banner) banner.style.display = 'block';
  }
}
function dismissIgBanner() {
  const banner = document.getElementById('ig-banner');
  if (banner) banner.style.display = 'none';
}
window.dismissIgBanner = dismissIgBanner;

/* ════════════════════════════════════════════════════════════════
   TAFMUN
   ════════════════════════════════════════════════════════════════ */

function initTAFMUNBankDetails() {
  ['taf', 'tsf'].forEach(p => {
    const t = document.getElementById(`${p}-bank-title`);
    const b = document.getElementById(`${p}-bank-name`);
    const a = document.getElementById(`${p}-bank-account`);
    if (t) t.textContent = TAFMUN_CONFIG.bankAccount.accountTitle;
    if (b) b.textContent = TAFMUN_CONFIG.bankAccount.bank;
    if (a) a.textContent = TAFMUN_CONFIG.bankAccount.accountNumber;
  });
}

function openTafView(view) {
  const landing  = document.getElementById('taf-landing');
  const standard = document.getElementById('taf-view-standard');
  const special  = document.getElementById('taf-view-special');
  if (landing)  landing.style.display  = 'none';
  if (standard) standard.style.display = (view === 'standard') ? 'block' : 'none';
  if (special)  special.style.display  = (view === 'special')  ? 'block' : 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function backToLanding() {
  const landing  = document.getElementById('taf-landing');
  const standard = document.getElementById('taf-view-standard');
  const special  = document.getElementById('taf-view-special');
  if (landing)  landing.style.display  = 'block';
  if (standard) standard.style.display = 'none';
  if (special)  special.style.display  = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function resetTAFMUNLanding() {
  backToLanding();

  const stdSuccess = document.getElementById('taf-success');
  if (stdSuccess) stdSuccess.style.display = 'none';
  const stdForm = document.querySelector('#taf-view-standard .taf-form-side');
  const stdInfo = document.querySelector('#taf-view-standard .taf-info-side');
  if (stdForm) stdForm.style.display = '';
  if (stdInfo) stdInfo.style.display = '';

  const spSuccess = document.getElementById('taf-special-success');
  if (spSuccess) spSuccess.style.display = 'none';
  const spForm = document.querySelector('#taf-view-special .taf-form-side');
  const spInfo = document.querySelector('#taf-view-special .taf-info-side');
  if (spForm) spForm.style.display = '';
  if (spInfo) spInfo.style.display = '';
}
window.openTafView   = openTafView;
window.backToLanding = backToLanding;

function initTAFMUNStandard() {
  [1, 2, 3].forEach(n => {
    const sel = document.getElementById(`taf-committee-${n}`);
    if (!sel) return;
    TAFMUN_CONFIG.committees.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => updatePriorityOptions('taf'));
  });
  updatePriorityOptions('taf');

  const fi = document.getElementById('taf-payment-proof');
  const fileText = document.getElementById('taf-upload-file');
  const uploadText = document.getElementById('taf-upload-text');
  if (fi) {
    fi.addEventListener('change', () => {
      const f = fi.files[0];
      if (f) {
        if (fileText) fileText.textContent = f.name;
        if (uploadText) uploadText.textContent = 'Selected:';
      } else {
        if (fileText) fileText.textContent = '';
        if (uploadText) uploadText.textContent = 'Click to upload your payment screenshot';
      }
    });
  }
}

function updatePriorityOptions(prefix) {
  const sels = [1, 2, 3].map(n => document.getElementById(`${prefix}-committee-${n}`));
  const values = sels.map(s => s ? s.value : '');
  sels.forEach((sel, i) => {
    if (!sel) return;
    Array.from(sel.options).forEach(opt => {
      if (!opt.value) return;
      const takenByOther = values.some((v, j) => j !== i && v === opt.value);
      opt.disabled = takenByOther;
    });
  });
}

function validatePriorities(prefix) {
  const v = [1, 2, 3].map(n => (document.getElementById(`${prefix}-committee-${n}`)?.value || ''));
  const errors = [
    `${prefix}-committee-1-error`,
    `${prefix}-committee-2-error`,
    `${prefix}-committee-3-error`
  ];
  let ok = true;

  errors.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  });

  v.forEach((val, i) => {
    if (!val) {
      const el = document.getElementById(errors[i]);
      if (el) {
        el.textContent = `Please select your ${['1st','2nd','3rd'][i]} committee priority.`;
        el.style.display = 'block';
      }
      ok = false;
    }
  });
  if (!ok) return false;

  if (new Set(v).size !== 3) {
    const el = document.getElementById(`${prefix}-committee-2-error`);
    if (el) {
      el.textContent = 'Committee priorities must be different.';
      el.style.display = 'block';
    }
    return false;
  }
  return true;
}

/* ── Submit standard ── */
async function submitTAFMUN() {
  const btn = document.getElementById('taf-submit-btn');
  if (!btn || btn.disabled) return;

  document.querySelectorAll('#taf-view-standard .taf-error-msg').forEach(el => el.style.display = 'none');

  const fullName = document.getElementById('taf-name').value.trim();
  const phone    = document.getElementById('taf-phone').value.trim();
  const email    = document.getElementById('taf-email').value.trim();
  const grade    = document.getElementById('taf-grade').value;
  const school   = document.getElementById('taf-school').value.trim();
  const fileInput = document.getElementById('taf-payment-proof');
  const file      = fileInput.files[0];

  let valid = true;

  if (!fullName) { showErr('taf-name-error'); valid = false; }
  if (!phone) {
    showErr('taf-phone-error', 'Phone number is required.'); valid = false;
  } else if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    showErr('taf-phone-error', 'Please enter a valid phone number.'); valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('taf-email-error'); valid = false;
  }
  if (!grade)  { showErr('taf-grade-error');  valid = false; }
  if (!school) { showErr('taf-school-error'); valid = false; }
  if (!validatePriorities('taf')) valid = false;
  if (!file)   { showErr('taf-file-error');   valid = false; }

  if (!valid) return;

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    alert('Invalid file type. Only JPG, PNG or WEBP are allowed.');
    return;
  }
  if (file.size / (1024 * 1024) > 2) {
    alert('File is too large. Maximum 2MB allowed.');
    return;
  }
  if (file.size === 0) {
    alert('The selected file appears to be empty. If you opened this page from Instagram, please open it in Safari or Chrome instead.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64 = e.target.result.split(',')[1];
    btn.disabled = true;
    const label = btn.querySelector('.btn-send-txt');
    const orig  = label.textContent;
    label.textContent = 'Submitting...';

    try {
      const res = await fetch('/api/send-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationType: 'standard',
          fullName, email, phoneNumber: phone, grade, school,
          firstPriority:  document.getElementById('taf-committee-1').value,
          secondPriority: document.getElementById('taf-committee-2').value,
          thirdPriority:  document.getElementById('taf-committee-3').value,
          paymentProofBase64: base64,
          paymentProofMime:   file.type
        })
      });
      const data = await res.json();
      if (res.ok) {
        label.textContent = 'Submitted ✓';
        btn.style.cssText = 'background:rgba(60,180,100,0.1);border-color:#3cb464;color:#3cb464;';
        const fs = document.querySelector('#taf-view-standard .taf-form-side');
        const is = document.querySelector('#taf-view-standard .taf-info-side');
        if (fs) fs.style.display = 'none';
        if (is) is.style.display = 'none';
        const ok = document.getElementById('taf-success');
        if (ok) ok.style.display = 'block';
      } else {
        btn.disabled = false;
        label.textContent = orig;
        alert(data.error || 'Registration could not be submitted. Please try again.');
      }
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      label.textContent = orig;
      alert('Network error. Please try again.');
    }
  };
  reader.onerror = function () {
    alert('Could not read the selected file. If you opened this page from Instagram, please open it in Safari or Chrome instead.');
    btn.disabled = false;
  };
  reader.readAsDataURL(file);
}
window.submitTAFMUN = submitTAFMUN;

/* ── Special init ── */
function initTAFMUNSpecial() {
  [1, 2, 3].forEach(n => {
    const sel = document.getElementById(`tsf-committee-${n}`);
    if (!sel) return;
    TAFMUN_CONFIG.committees.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => updatePriorityOptions('tsf'));
  });
  updatePriorityOptions('tsf');

  const fi = document.getElementById('tsf-payment-proof');
  const fileText = document.getElementById('tsf-upload-file');
  const uploadText = document.getElementById('tsf-upload-text');
  if (fi) {
    fi.addEventListener('change', () => {
      const f = fi.files[0];
      if (f) {
        if (fileText) fileText.textContent = f.name;
        if (uploadText) uploadText.textContent = 'Selected:';
      } else {
        if (fileText) fileText.textContent = '';
        if (uploadText) uploadText.textContent = 'Click to upload your payment screenshot';
      }
    });
  }

  document.querySelectorAll('input[name="tsf-crisis"]').forEach(r => {
    r.addEventListener('change', () => {
      const wrap = document.getElementById('tsf-crisis-exp-wrap');
      if (!wrap) return;
      if (r.value === 'Yes' && r.checked) {
        wrap.classList.add('visible');
      } else if (r.value === 'No' && r.checked) {
        wrap.classList.remove('visible');
        const inp = document.getElementById('tsf-crisis-exp');
        if (inp) inp.value = '';
      }
    });
  });
}

/* ── Submit special ── */
async function submitSpecialTAFMUN() {
  const btn = document.getElementById('taf-special-submit-btn');
  if (!btn || btn.disabled) return;

  document.querySelectorAll('#taf-view-special .taf-error-msg').forEach(el => el.style.display = 'none');

  const getRadio = name => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  };

  const fullName   = document.getElementById('tsf-name').value.trim();
  const email      = document.getElementById('tsf-email').value.trim();
  const phone      = document.getElementById('tsf-phone').value.trim();
  const grade      = document.getElementById('tsf-grade').value;
  const school     = document.getElementById('tsf-school').value.trim();
  const watchedGoT = getRadio('tsf-got');
  const westeros   = getRadio('tsf-westeros');
  const crisis     = getRadio('tsf-crisis');
  const crisisExp  = document.getElementById('tsf-crisis-exp').value.trim();
  const munExp     = document.getElementById('tsf-mun-exp').value;
  const fileInput  = document.getElementById('tsf-payment-proof');
  const file       = fileInput.files[0];

  let valid = true;

  if (!fullName) { showErr('tsf-name-error'); valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('tsf-email-error'); valid = false;
  }
  if (!phone || !/^[0-9+\-\s()]{7,20}$/.test(phone)) { showErr('tsf-phone-error'); valid = false; }
  if (!grade)  { showErr('tsf-grade-error');  valid = false; }
  if (!school) { showErr('tsf-school-error'); valid = false; }
  if (!watchedGoT) { showErr('tsf-got-error'); valid = false; }
  if (!westeros)   { showErr('tsf-westeros-error'); valid = false; }
  if (!crisis)     { showErr('tsf-crisis-error');   valid = false; }
  if (crisis === 'Yes' && !crisisExp) { showErr('tsf-crisis-exp-error'); valid = false; }
  if (!munExp)     { showErr('tsf-mun-exp-error');  valid = false; }
  if (!validatePriorities('tsf')) valid = false;
  if (!file) { showErr('tsf-file-error'); valid = false; }

  if (!valid) return;

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    alert('Invalid file type. Only JPG, PNG or WEBP are allowed.');
    return;
  }
  if (file.size / (1024 * 1024) > 2) {
    alert('File is too large. Maximum 2MB allowed.');
    return;
  }
  if (file.size === 0) {
    alert('The selected file appears to be empty. If you opened this page from Instagram, please open it in Safari or Chrome instead.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64 = e.target.result.split(',')[1];
    btn.disabled = true;
    const label = btn.querySelector('.btn-send-txt');
    const orig  = label.textContent;
    label.textContent = 'Submitting...';

    try {
      const res = await fetch('/api/send-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationType: 'special',
          fullName, email, phoneNumber: phone, grade, school,
          firstPriority:  document.getElementById('tsf-committee-1').value,
          secondPriority: document.getElementById('tsf-committee-2').value,
          thirdPriority:  document.getElementById('tsf-committee-3').value,
          watchedGoT, westerosFamiliarity: westeros,
          crisisBefore: crisis,
          crisisExperience: crisis === 'Yes' ? crisisExp : '',
          munExperience: munExp,
          paymentProofBase64: base64,
          paymentProofMime:   file.type
        })
      });
      const data = await res.json();
      if (res.ok) {
        label.textContent = 'Submitted ✓';
        btn.style.cssText = 'background:rgba(60,180,100,0.1);border-color:#3cb464;color:#3cb464;';
        const fs = document.querySelector('#taf-view-special .taf-form-side');
        const is = document.querySelector('#taf-view-special .taf-info-side');
        if (fs) fs.style.display = 'none';
        if (is) is.style.display = 'none';
        const ok = document.getElementById('taf-special-success');
        if (ok) ok.style.display = 'block';
      } else {
        btn.disabled = false;
        label.textContent = orig;
        alert(data.error || 'Special registration could not be submitted. Please try again.');
      }
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      label.textContent = orig;
      alert('Network error. Please try again.');
    }
  };
  reader.onerror = function () {
    alert('Could not read the selected file. If you opened this page from Instagram, please open it in Safari or Chrome instead.');
    btn.disabled = false;
  };
  reader.readAsDataURL(file);
}
window.submitSpecialTAFMUN = submitSpecialTAFMUN;

/* ── Helpers ── */
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  if (msg) el.textContent = msg;
  el.style.display = 'block';
}

function initCopyButton(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener('click', (ev) => {
    try {
      if (ev && ev.preventDefault) ev.preventDefault();
    } catch (e) {}

    const text = TAFMUN_CONFIG.bankAccount.accountNumber;

    if (navigator.clipboard && window.isSecureContext && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => {
        showCopySuccess(btn);
      }).catch(() => {
        legacyCopy(text, btn);
      });
    } else {
      legacyCopy(text, btn);
    }
  });
}

function legacyCopy(text, btn) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  ta.style.pointerEvents = 'none';
  ta.setAttribute('readonly', '');
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, ta.value.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (err) {
    ok = false;
  }

  document.body.removeChild(ta);

  if (ok) {
    showCopySuccess(btn);
  } else {
    alert('Could not copy automatically. Please long-press the account number to copy it.');
  }
}

function showCopySuccess(btn) {
  const orig = btn.dataset.origText || btn.textContent;
  btn.dataset.origText = orig;
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = orig;
    btn.classList.remove('copied');
  }, 2000);
}