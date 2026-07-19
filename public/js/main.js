// Toast notifications
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3500);
}

// Sync package selector with radio buttons
function selectPackage(pkg) {
  const radio = document.querySelector(`input[name="package"][value="${pkg}"]`);
  if (radio) radio.checked = true;
  updatePrice();
  document.getElementById('commander').scrollIntoView({ behavior: 'smooth' });
}

const prices = { starter: 499, pro: 999, premium: 1799 };

function updatePrice() {
  const selected = document.querySelector('input[name="package"]:checked');
  if (!selected) return;
  const display = document.getElementById('priceDisplay');
  if (display) display.textContent = prices[selected.value] + ' €';
}

// Init price
document.addEventListener('DOMContentLoaded', () => {
  updatePrice();
  document.querySelectorAll('input[name="package"]').forEach(r => r.addEventListener('change', updatePrice));
});

// Collect checkbox values
function getChecked(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
}

// Order form submission
const form = document.getElementById('orderForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Traitement en cours...';

    const data = {
      client_name: form.client_name.value.trim(),
      client_email: form.client_email.value.trim(),
      client_phone: form.client_phone.value.trim(),
      business_name: form.business_name.value.trim(),
      business_type: form.business_type.value,
      description: form.description.value.trim(),
      pages: getChecked('pages'),
      features: getChecked('features'),
      colors: form.colors.value.trim(),
      reference_urls: form.reference_urls.value.trim(),
      package: form.package.value
    };

    if (data.pages.length === 0) {
      showToast('Sélectionnez au moins une page', 'error');
      btn.disabled = false;
      btn.textContent = 'Passer la commande & payer →';
      return;
    }

    try {
      // 1. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || 'Erreur création commande');

      // 2. Create Stripe checkout session
      const payRes = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.order_id })
      });
      const pay = await payRes.json();
      if (!payRes.ok) throw new Error(pay.error || 'Erreur paiement');

      // 3. Redirect to Stripe
      window.location.href = pay.url;

    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Passer la commande & payer →';
    }
  });
}

// Handle cancelled payment
if (new URLSearchParams(location.search).get('cancelled')) {
  setTimeout(() => showToast('Paiement annulé. Vous pouvez réessayer.', 'error'), 500);
}
