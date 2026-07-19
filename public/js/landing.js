// ── NAV ──
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

function toggleMenu() {
  const links = document.querySelector('.nav-links');
  links.classList.toggle('mobile-open');
}

// ── FAQ ──
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-a');
  const arrow = btn.querySelector('.faq-arrow');
  const isOpen = answer.classList.contains('open');

  document.querySelectorAll('.faq-a.open').forEach(a => {
    a.classList.remove('open');
    a.closest('.faq-item').querySelector('.faq-arrow')?.classList.remove('open');
  });

  if (!isOpen) {
    answer.classList.add('open');
    arrow.classList.add('open');
  }
}

// ── TOAST ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 4000);
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.style.opacity = '1';
        en.target.style.transform = 'translateY(0)';
        observer.unobserve(en.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.how-step, .portfolio-card, .testi-card, .price-card, .price-options-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });
});
