/* ============================================================
   THE AURORA FORUM — SCRIPT v6 (MUN removed)
   ============================================================ */

const state = { currentPage: 'front', transitioning: false };
const pages = ['front', 'about', 'tafmun', 'events', 'contact'];

/* TAFMUN CONFIG – edit these values */
const TAFMUN_CONFIG = {
  fee: 2200,
  easypaisaNumber: "03XXXXXXXXX",
  committees: ["UNSC", "UNHCR", "WHO"] // ← change to your real committee names
};

let veil, dock, main;

document.addEventListener('DOMContentLoaded', () => {
  veil = document.getElementById('veil');
  dock = document.getElementById('dock');
  main = document.getElementById('main');

  setDates();
  initScrollReveal();
  initKeyboard();
  initSwipe();
  initDockHover();
  initScrollHide();
  initParallaxLogo();
  initPageEnterEffects();
  initCursorTrail();
  initHeroParticles();
  initTiltCards();
  initCounters();
  initTypewriter();
  initMemberFlip();
  initEventHover();
  initContactFx();
  initTAFMUNConfig();
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

  if (navigator.vibrate) navigator.vibrate(8);

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
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    state.currentPage = pageId;

    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });

    initScrollReveal();
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (veil) veil.classList.remove('covering');
    setTimeout(() => { state.transitioning = false; }, 280);
  }, 240);
}
window.navigate = navigate;

/* ── DOCK HOVER (magnetic) ── */
function initDockHover() {
  if (!dock) return;
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
  dock.style.transition = 'transform 0.45s cubic-bezier(0.34,1.4,0.64,1), opacity 0.3s ease';
  let lastY = 0, ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y    = window.scrollY;
      const diff = y - lastY;
      if (diff > 55 && y > 180) {
        dock.style.transform    = 'translateY(110%)';
        dock.style.opacity      = '0';
        dock.style.pointerEvents = 'none';
      } else if (diff < -15 || y < 80) {
        dock.style.transform    = '';
        dock.style.opacity      = '';
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
    form.querySelector('[aria-invalid="true"]')?.focus();
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

/* ════════════════════════════════════════════════
   TAFMUN REGISTRATION LOGIC
   ════════════════════════════════════════════════ */

function initTAFMUNConfig() {
  const committeeSelect = document.getElementById('taf-committee');
  if (committeeSelect) {
    TAFMUN_CONFIG.committees.forEach((committee, index) => {
      const option = document.createElement('option');
      option.value = committee;
      option.textContent = committee;
      committeeSelect.appendChild(option);
    });
  }

  const feeEl = document.getElementById('taf-fee');
  if (feeEl) feeEl.textContent = `Rs. ${TAFMUN_CONFIG.fee.toLocaleString()}`;
  
  const epEl = document.getElementById('taf-easypaisa-number');
  if (epEl) epEl.textContent = TAFMUN_CONFIG.easypaisaNumber;

  const fileInput = document.getElementById('taf-payment-proof');
  const fileText = document.getElementById('taf-upload-file');
  const uploadText = document.getElementById('taf-upload-text');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 2) {
          fileInput.value = '';
          if (fileText) fileText.textContent = '';
          if (uploadText) uploadText.textContent = 'File is too large (max 2MB). Please upload a smaller screenshot.';
          return;
        }
        if (fileText) fileText.textContent = file.name;
        if (uploadText) uploadText.textContent = 'Selected:';
      } else {
        if (fileText) fileText.textContent = '';
        if (uploadText) uploadText.textContent = 'Click to upload your payment screenshot';
      }
    });
  }
}

async function submitTAFMUN() {
  const btn = document.getElementById('taf-submit-btn');
  if (!btn || btn.disabled) return;

  document.querySelectorAll('.taf-error-msg').forEach(el => el.style.display = 'none');

  const fullName = document.getElementById('taf-name').value.trim();
  const grade = document.getElementById('taf-grade').value;
  const school = document.getElementById('taf-school').value.trim();
  const committee = document.getElementById('taf-committee').value;
  const fileInput = document.getElementById('taf-payment-proof');
  const file = fileInput.files[0];

  let valid = true;
  if (!fullName) { const err = document.getElementById('taf-name-error'); if (err) err.style.display = 'block'; valid = false; }
  if (!grade) { const err = document.getElementById('taf-grade-error'); if (err) err.style.display = 'block'; valid = false; }
  if (!school) { const err = document.getElementById('taf-school-error'); if (err) err.style.display = 'block'; valid = false; }
  if (!committee) { const err = document.getElementById('taf-committee-error'); if (err) err.style.display = 'block'; valid = false; }
  if (!file) { const err = document.getElementById('taf-file-error'); if (err) err.style.display = 'block'; valid = false; }
  if (!valid) return;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type. Only JPG, PNG or WEBP are allowed.');
    return;
  }
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > 2) {
    alert('File is too large. Maximum 2MB allowed.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result.split(',')[1];
    const mime = file.type;

    btn.disabled = true;
    const origText = btn.querySelector('.btn-send-txt').textContent;
    btn.querySelector('.btn-send-txt').textContent = 'Submitting...';

    try {
      const response = await fetch('/api/send-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, grade, school, committee, paymentProofBase64: base64, paymentProofMime: mime })
      });

      const data = await response.json();

      if (response.ok) {
        btn.querySelector('.btn-send-txt').textContent = 'Submitted ✓';
        btn.style.cssText = 'background:rgba(60,180,100,0.1);border-color:#3cb464;color:#3cb464;';
        document.querySelector('.taf-form-side').style.display = 'none';
        document.querySelector('.taf-info-side').style.display = 'none';
        const successEl = document.getElementById('taf-success');
        if (successEl) successEl.style.display = 'block';
      } else {
        btn.disabled = false;
        btn.querySelector('.btn-send-txt').textContent = origText;
        alert(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.querySelector('.btn-send-txt').textContent = origText;
      alert('Network error. Please try again.');
    }
  };
  reader.readAsDataURL(file);
}