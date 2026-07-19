// ── TOAST ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 4000);
}

// ── PRICING ──
const BASE = 49, INCLUDED_PAGES = 3, EXTRA_PAGE = 10, LOGO_PRICE = 25;

function getChecked(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
}

function computeTotal() {
  let total = BASE;
  const pages = getChecked('pages');
  total += Math.max(0, pages.length - INCLUDED_PAGES) * EXTRA_PAGE;
  document.querySelectorAll('input[name="options"]:checked').forEach(el => {
    total += parseInt(el.dataset.price || '0', 10);
  });
  const logo = document.querySelector('input[name="logo_choice"]:checked');
  if (logo && logo.value === 'create') total += LOGO_PRICE;
  return total;
}

function updateTotals() {
  const t = computeTotal() + ' €';
  const wizTotal = document.getElementById('wizTotal');
  const recapTotal = document.getElementById('recapTotal');
  if (wizTotal) wizTotal.textContent = t;
  if (recapTotal) recapTotal.textContent = t;
}

// ── WIZARD ──
const TOTAL_STEPS = 6;
let currentStep = 1;

function showStep(n) {
  currentStep = n;
  document.querySelectorAll('.wiz-step').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.step) === n);
  });
  document.querySelectorAll('.wiz-label').forEach(l => {
    const ln = parseInt(l.dataset.step);
    l.classList.toggle('active', ln === n);
    l.classList.toggle('done', ln < n);
  });
  document.getElementById('wizFill').style.width = ((n - 1) / (TOTAL_STEPS - 1) * 100) + '%';
  document.getElementById('wizBack').style.visibility = n === 1 ? 'hidden' : 'visible';
  document.getElementById('wizNext').style.display = n === TOTAL_STEPS ? 'none' : 'inline-flex';
  document.getElementById('wizSubmit').style.display = n === TOTAL_STEPS ? 'inline-flex' : 'none';

  if (n === TOTAL_STEPS) buildRecap();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep(n) {
  const form = document.getElementById('orderForm');
  const err = (msg) => { showToast(msg, 'error'); return false; };

  if (n === 1) {
    if (!form.client_name.value.trim()) return err('Indiquez votre nom');
    if (!form.client_email.value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.client_email.value.trim())) return err('Indiquez un email valide');
    if (!form.client_phone.value.trim()) return err('Indiquez votre téléphone');
    trackEvent('InitiateCheckout');
  }
  if (n === 2) {
    if (!form.business_name.value.trim()) return err('Indiquez le nom de votre entreprise');
    if (!form.business_type.value) return err('Sélectionnez votre secteur');
    if (form.description.value.trim().length < 20) return err('Décrivez votre activité (au moins quelques phrases)');
  }
  if (n === 3) {
    const choice = form.domain_choice.value;
    if (choice === 'new' && !form.domain_name.value.trim()) return err('Indiquez le domaine souhaité (ou choisissez "Proposez-moi")');
    if (choice === 'existing' && !form.domain_existing.value.trim()) return err('Indiquez votre domaine actuel');
  }
  if (n === 5) {
    if (getChecked('pages').length === 0) return err('Sélectionnez au moins une page');
  }
  return true;
}

function buildRecap() {
  const form = document.getElementById('orderForm');
  const pages = getChecked('pages');
  const extraPages = Math.max(0, pages.length - INCLUDED_PAGES);
  const opts = [];
  document.querySelectorAll('input[name="options"]:checked').forEach(el => {
    opts.push(`${el.closest('.option-row').querySelector('.option-name').textContent} (+${el.dataset.price}€)`);
  });
  const logo = document.querySelector('input[name="logo_choice"]:checked')?.value;
  if (logo === 'create') opts.push(`Création de logo (+${LOGO_PRICE}€)`);

  const domainChoice = form.domain_choice.value;
  let domainTxt = 'À définir ensemble';
  if (domainChoice === 'new') domainTxt = form.domain_name.value || 'Nouveau domaine';
  if (domainChoice === 'existing') domainTxt = form.domain_existing.value + ' (existant)';
  if (domainChoice === 'suggest') domainTxt = 'Propositions à venir';

  const rows = [
    ['Contact', `${form.client_name.value} · ${form.client_email.value} · ${form.client_phone.value}`],
    ['Entreprise', `${form.business_name.value} — ${form.business_type.value}`],
    ['Domaine', domainTxt],
    ['Pages', pages.join(', ') + (extraPages ? ` (${extraPages} page(s) supplémentaire(s) +${extraPages * EXTRA_PAGE}€)` : '')],
    ['Style', document.querySelector('input[name="style"]:checked')?.value || 'moderne'],
    ['Textes', form.content_choice.value === 'provided' ? 'Fournis par vous' : 'Rédigés par nous (inclus)'],
    ['Photos', form.photos_choice.value === 'own' ? 'Vos photos' : "Banque d'images pro (inclus)"],
    ['Options', opts.length ? opts.join(', ') : 'Aucune']
  ];

  document.getElementById('recap').innerHTML = rows.map(([k, v]) =>
    `<div class="recap-row"><span class="recap-k">${k}</span><span class="recap-v">${escapeHtml(v)}</span></div>`
  ).join('');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

document.getElementById('wizNext').addEventListener('click', () => {
  if (validateStep(currentStep)) showStep(currentStep + 1);
});
document.getElementById('wizBack').addEventListener('click', () => showStep(currentStep - 1));

// Champs conditionnels domaine
document.querySelectorAll('input[name="domain_choice"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('domainNew').style.display = r.value === 'new' && r.checked ? 'block' : 'none';
    document.getElementById('domainExisting').style.display = r.value === 'existing' && r.checked ? 'block' : 'none';
    if (r.value === 'suggest' && r.checked) {
      document.getElementById('domainNew').style.display = 'none';
      document.getElementById('domainExisting').style.display = 'none';
    }
  });
});

// Textes fournis → afficher la zone
document.querySelectorAll('input[name="content_choice"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('contentText').style.display =
      document.querySelector('input[name="content_choice"]:checked').value === 'provided' ? 'block' : 'none';
  });
});

// Total dynamique
document.addEventListener('change', (e) => {
  if (['pages', 'options', 'logo_choice'].includes(e.target.name)) updateTotals();
});

// ── SUBMIT ──
document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('wizSubmit');
  const text = document.getElementById('submitText');
  const spinner = document.getElementById('submitSpinner');
  btn.disabled = true;
  text.style.display = 'none';
  spinner.style.display = 'block';

  const domainChoice = form.domain_choice.value;
  const options = getChecked('options');
  if (document.querySelector('input[name="logo_choice"]:checked')?.value === 'create') options.push('logo');

  const data = {
    client_name: form.client_name.value.trim(),
    client_email: form.client_email.value.trim(),
    client_phone: form.client_phone.value.trim(),
    business_name: form.business_name.value.trim(),
    business_type: form.business_type.value,
    description: form.description.value.trim(),
    address: form.address.value.trim(),
    hours: form.hours.value.trim(),
    socials: { fb: form.social_fb.value.trim(), other: form.social_other.value.trim() },
    domain_choice: domainChoice,
    domain_name: domainChoice === 'existing' ? form.domain_existing.value.trim() : form.domain_name.value.trim(),
    domain_registrar: form.domain_registrar.value.trim(),
    content_text: form.content_choice.value === 'provided' ? form.content_text.value.trim() : '',
    logo_choice: document.querySelector('input[name="logo_choice"]:checked')?.value,
    photos_choice: document.querySelector('input[name="photos_choice"]:checked')?.value,
    style: document.querySelector('input[name="style"]:checked')?.value,
    pages: getChecked('pages'),
    colors: form.colors.value.trim(),
    reference_urls: form.reference_urls.value.trim(),
    options
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const order = await res.json();
    if (!res.ok) throw new Error(order.error || 'Erreur');

    trackEvent('Lead', { value: computeTotal(), currency: 'EUR' });
    window.location.href = `/success?tracking=${order.tracking_code}`;
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    text.style.display = 'block';
    spinner.style.display = 'none';
  }
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  updateTotals();
  trackEvent('InitiateCheckout');
});
