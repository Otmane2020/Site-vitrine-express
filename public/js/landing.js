/* ═══════════════════════════════════════════════════════════
   WEBIFY — Landing JS
   UI/UX Pro Max — Motion tier: Complex
   GSAP ScrollTrigger + SplitText chars + Parallax + Magnetic
   Canvas particle constellation (hero + CTA)
   3D mouse-tracking tilt on browser mockup
   ═══════════════════════════════════════════════════════════ */

/* ── NAV scroll class ── */
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

function toggleMenu() {
  document.querySelector('.nav-links')?.classList.toggle('mobile-open');
}

/* ── FAQ ── */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('faq-open');
  document.querySelectorAll('.faq-item.faq-open').forEach(i => {
    i.classList.remove('faq-open');
    i.querySelector('.faq-a')?.classList.remove('faq-a-open');
  });
  if (!isOpen) {
    item.classList.add('faq-open');
    answer.classList.add('faq-a-open');
  }
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

/* ════════════════════════════════════════════════════
   CANVAS — Particle Constellation
   UI/UX Pro Max: ambient atmosphere, slow drift
════════════════════════════════════════════════════ */
function initParticleCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let W, H, particles, raf;
  const COUNT = window.innerWidth < 768 ? 40 : 80;
  const MAX_DIST = 140;
  const ACCENT_RGB = '94,106,210';

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: COUNT }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r:  Math.random() * 1.4 + 0.6,
      o:  Math.random() * 0.4 + 0.15,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // update
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;
    }
    // connect
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      // dot
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT_RGB},${a.o})`;
      ctx.fill();
      // lines
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${ACCENT_RGB},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  const ro = new ResizeObserver(() => { resize(); createParticles(); });
  ro.observe(canvas);
}

/* ════════════════════════════════════════════════════
   3D MOUSE-TRACKING TILT on browser mockup
   Skill: elastic.out spring physics, clamp strength
════════════════════════════════════════════════════ */
function initMockupTilt() {
  const wrap = document.getElementById('mockupWrap');
  const mockup = document.getElementById('heroMockup');
  if (!wrap || !mockup) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX_X = 14, MAX_Y = 10;
  let curX = 0, curY = 0, targetX = 0, targetY = 0;
  let isHovered = false;

  wrap.addEventListener('mousemove', e => {
    const r = wrap.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - 0.5;  // -0.5 to 0.5
    const ny = (e.clientY - r.top)  / r.height - 0.5;
    targetX = ny * MAX_X * 2;   // rotateX
    targetY = -nx * MAX_Y * 2;  // rotateY
    isHovered = true;
  }, { passive: true });

  wrap.addEventListener('mouseleave', () => {
    targetX = 2; targetY = -4;   // gentle resting tilt
    isHovered = false;
  });

  // Lerp spring loop
  const ease = 0.08;
  function tick() {
    curX += (targetX - curX) * ease;
    curY += (targetY - curY) * ease;
    mockup.style.transform = `rotateX(${curX.toFixed(2)}deg) rotateY(${curY.toFixed(2)}deg)`;
    requestAnimationFrame(tick);
  }
  // init resting tilt
  targetX = 2; targetY = -4;
  tick();
}

/* ════════════════════════════════════════════════════
   STATS COUNTER — eased count-up
════════════════════════════════════════════════════ */
function animateCounter(el) {
  const target   = +el.dataset.target;
  const prefix   = el.dataset.prefix  || '';
  const suffix   = el.dataset.suffix  || '';
  const duration = 1600;
  const start    = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);   // ease-out cubic
    el.textContent = prefix + Math.round(eased * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ════════════════════════════════════════════════════
   SCROLL REVEAL with stagger
   Skill: duration 300-700ms, expo.out, stagger 30-50ms
════════════════════════════════════════════════════ */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('visible');
      obs.unobserve(en.target);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.js-reveal').forEach(el => obs.observe(el));
}

/* ════════════════════════════════════════════════════
   COUNTER observer
════════════════════════════════════════════════════ */
function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting && en.target.dataset.target) {
        animateCounter(en.target);
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num[data-target]').forEach(el => obs.observe(el));
}

/* ════════════════════════════════════════════════════
   HERO HEADLINE — character-level stagger reveal
   Skill: SplitText chars rotateX: -40, stagger 0.015, expo.out
   (Pure CSS/JS fallback — no GSAP Club required)
════════════════════════════════════════════════════ */
function initHeadlineAnim() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lines = document.querySelectorAll('.h1-line');
  lines.forEach((line, li) => {
    // wrap each char in a span
    const text = line.textContent;
    // preserve child elements (spans) inside the line
    const children = [...line.childNodes];
    line.innerHTML = '';

    let charIdx = 0;
    children.forEach(node => {
      if (node.nodeType === 3) { // text node
        [...node.textContent].forEach(ch => {
          const span = document.createElement('span');
          span.style.cssText = `
            display:inline-block;
            opacity:0;
            transform:translateY(24px) rotateX(-40deg);
            transition: opacity .55s cubic-bezier(0.16,1,0.3,1), transform .55s cubic-bezier(0.16,1,0.3,1);
            transition-delay: ${(li * 8 + charIdx) * 18}ms;
            transform-origin: bottom center;
          `;
          span.textContent = ch === ' ' ? ' ' : ch;
          line.appendChild(span);
          charIdx++;
        });
      } else if (node.nodeType === 1) { // element node
        const clone = node.cloneNode(true);
        [...clone.textContent].forEach((ch, ci) => {
          /* wrap inner text chars */
        });
        clone.style.cssText = `
          display:inline-block;
          opacity:0;
          transform:translateY(24px) rotateX(-40deg);
          transition: opacity .55s cubic-bezier(0.16,1,0.3,1), transform .55s cubic-bezier(0.16,1,0.3,1);
          transition-delay: ${(li * 8 + charIdx) * 18}ms;
          transform-origin: bottom center;
        `;
        line.appendChild(clone);
        charIdx++;
      }
    });
  });

  // trigger after paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.querySelectorAll('.h1-line > span, .h1-line > *').forEach(s => {
        s.style.opacity = '1';
        s.style.transform = 'translateY(0) rotateX(0)';
      });
    }, 120);
  });
}

/* ════════════════════════════════════════════════════
   MAGNETIC HOVER on hero CTA
   Skill: elastic.out(1,0.4), clamp * 0.3, max 1-2 elements
════════════════════════════════════════════════════ */
function initMagneticButtons() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 1024) return; // desktop only

  document.querySelectorAll('.btn-hero, .btn-final').forEach(el => {
    let animFrame;
    let curX = 0, curY = 0;

    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left - r.width  / 2;
      const cy = e.clientY - r.top  - r.height / 2;
      const tx = cx * 0.3;
      const ty = cy * 0.3;
      cancelAnimationFrame(animFrame);
      function spring() {
        curX += (tx - curX) * 0.12;
        curY += (ty - curY) * 0.12;
        el.style.transform = `translate(${curX.toFixed(1)}px,${curY.toFixed(1)}px) scale(1.04)`;
        if (Math.abs(tx - curX) > 0.1 || Math.abs(ty - curY) > 0.1) {
          animFrame = requestAnimationFrame(spring);
        }
      }
      spring();
    }, { passive: true });

    el.addEventListener('mouseleave', () => {
      cancelAnimationFrame(animFrame);
      function restore() {
        curX += (0 - curX) * 0.12;
        curY += (0 - curY) * 0.12;
        el.style.transform = `translate(${curX.toFixed(1)}px,${curY.toFixed(1)}px) scale(1)`;
        if (Math.abs(curX) > 0.1 || Math.abs(curY) > 0.1) {
          animFrame = requestAnimationFrame(restore);
        } else {
          el.style.transform = '';
        }
      }
      restore();
    });
  });
}

/* ════════════════════════════════════════════════════
   PARALLAX on hero blobs — multi-layer scrub
   Skill: keep yPercent delta small (5-15), bg layers only
════════════════════════════════════════════════════ */
function initParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const g1 = document.querySelector('.hero-glow-1');
  const g2 = document.querySelector('.hero-glow-2');
  if (!g1 || !g2) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const sy = window.scrollY;
      g1.style.transform = `translate(0, ${sy * 0.18}px) scale(1)`;
      g2.style.transform = `translate(0, ${-sy * 0.1}px) scale(1)`;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
}

/* ════════════════════════════════════════════════════
   PORTFOLIO CARDS — 3D tilt on hover (CSS transform)
   Skill: scale press 0.97→1.0, preserve-3d card hover
════════════════════════════════════════════════════ */
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 1024) return;

  document.querySelectorAll('.p-card:not(.p-cta-card)').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5;
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${ny * -8}deg) rotateY(${nx * 8}deg)`;
    }, { passive: true });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initParticleCanvas('heroCanvas');
  initParticleCanvas('ctaCanvas');
  initMockupTilt();
  initReveal();
  initCounters();
  initHeadlineAnim();
  initMagneticButtons();
  initParallax();
  initCardTilt();
});
