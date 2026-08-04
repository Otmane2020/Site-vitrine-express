/* Bouton flottant WhatsApp — partagé sur toutes les pages qui incluent ce script */
(function () {
  const WHATSAPP_NUMBER = '33749072281';
  const WHATSAPP_MSG = encodeURIComponent("Bonjour, j'ai une question sur la création de mon site vitrine.");

  const style = document.createElement('style');
  style.textContent = `
    .wf-whatsapp-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 500;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #25D366;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(37,211,102,.45);
      transition: transform .2s, box-shadow .2s;
      text-decoration: none;
    }
    .wf-whatsapp-btn:hover { transform: scale(1.08); box-shadow: 0 8px 26px rgba(37,211,102,.55); }
    .wf-whatsapp-btn svg { width: 30px; height: 30px; }
    .wf-whatsapp-pulse {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #25D366;
      opacity: .55;
      animation: wf-pulse 2.2s ease-out infinite;
    }
    @keyframes wf-pulse {
      0% { transform: scale(1); opacity: .55; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    @media (max-width: 480px) {
      .wf-whatsapp-btn { bottom: 16px; right: 16px; width: 52px; height: 52px; }
      .wf-whatsapp-btn svg { width: 27px; height: 27px; }
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('a');
  btn.className = 'wf-whatsapp-btn';
  btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.setAttribute('aria-label', 'Contacter Webify sur WhatsApp');
  btn.innerHTML = `
    <span class="wf-whatsapp-pulse"></span>
    <svg viewBox="0 0 24 24" fill="#fff" style="position:relative;z-index:1"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.15c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.02.28-3.42-.72-2.9-1.2-4.77-4.13-4.92-4.32-.14-.2-1.17-1.56-1.17-2.97 0-1.41.74-2.1 1-2.4.26-.3.57-.36.76-.36.19 0 .38 0 .55.01.18.01.42-.07.66.5.24.6.82 2.06.9 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.5-.14.17-.3.38-.43.51-.14.14-.3.3-.13.58.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.3.14.47.12.64-.07.18-.2.75-.87.95-1.17.2-.3.4-.24.66-.14.28.1 1.72.81 2.02.96.3.14.5.22.57.33.08.13.08.7-.16 1.38z"/></svg>
  `;
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
})();
