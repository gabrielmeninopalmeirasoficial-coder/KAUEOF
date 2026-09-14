const amountInput = document.getElementById('amount');
document.querySelectorAll('.amount-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.amount-btn').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed','false'); });
  btn.classList.add('selected');
  btn.setAttribute('aria-pressed','true');
  amountInput.value = btn.dataset.value;
}));

document.querySelectorAll('.scroll-donate').forEach(btn => btn.addEventListener('click', () => document.getElementById('doar')?.scrollIntoView({behavior:'smooth'})));

const anonymousToggle = document.getElementById('anonymous-toggle');
const donorNameInput = document.getElementById('donor-name');
const donorNameWrap = document.getElementById('donor-name-wrap');
const identityHelp = document.getElementById('identity-help');

function ensureNameErrorElement() {
  if (!donorNameWrap) return null;

  let error = document.getElementById('donor-name-error');
  if (!error) {
    error = document.createElement('small');
    error.id = 'donor-name-error';
    error.setAttribute('role', 'alert');
    error.setAttribute('aria-live', 'polite');
    error.style.display = 'none';
    error.style.marginTop = '6px';
    error.style.fontSize = '13px';
    error.style.fontWeight = '700';
    error.style.lineHeight = '1.3';
    error.style.color = '#d93025';
    error.textContent = 'Digite um nome válido, sem números.';
    donorNameWrap.appendChild(error);
  }
  return error;
}

function isValidDonorName(value) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name) return false;
  if (/\d/u.test(name)) return false;
  if (!/^[\p{L}][\p{L}\s'’\-]{1,79}$/u.test(name)) return false;
  const letters = name.match(/\p{L}/gu) || [];
  return letters.length >= 2;
}

function clearNameError() {
  if (!donorNameInput) return;
  const error = ensureNameErrorElement();
  donorNameInput.removeAttribute('aria-invalid');
  donorNameInput.style.borderColor = '';
  donorNameInput.style.boxShadow = '';
  if (error) error.style.display = 'none';
}

function showNameError() {
  if (!donorNameInput) return;
  const error = ensureNameErrorElement();
  donorNameInput.setAttribute('aria-invalid', 'true');
  donorNameInput.style.borderColor = '#d93025';
  donorNameInput.style.boxShadow = '0 0 0 3px rgba(217,48,37,.12)';
  if (error) error.style.display = 'block';

  // Mantém o cliente exatamente no formulário e leva o campo inválido até a tela.
  donorNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => donorNameInput.focus({ preventScroll: true }), 180);
}

function syncAnonymousMode() {
  if (!anonymousToggle || !donorNameInput || !donorNameWrap) return;
  const anonymous = anonymousToggle.checked;
  donorNameWrap.hidden = anonymous;
  donorNameWrap.style.display = anonymous ? 'none' : '';
  donorNameWrap.setAttribute('aria-hidden', anonymous ? 'true' : 'false');
  // O nome é validado por JavaScript + backend. Não usamos o atributo HTML
  // 'required' porque ele pode bloquear o envio no modo anônimo antes do JS.
  donorNameInput.required = false;
  donorNameInput.disabled = anonymous;
  if (anonymous) {
    donorNameInput.value = '';
    clearNameError();
  }
  if (identityHelp) {
    identityHelp.textContent = anonymous
      ? 'Modo anônimo: o sistema gera automaticamente um nome sintético e os demais dados de teste.'
      : 'Pagamento processado de forma segura via PIX (QR Code ou copia e cola)';
  }
}

anonymousToggle?.addEventListener('change', syncAnonymousMode);
donorNameInput?.addEventListener('input', () => {
  // Assim que o cliente começa a corrigir, removemos o destaque vermelho.
  // Se ainda estiver inválido, a mensagem reaparece somente no próximo envio.
  clearNameError();
});
syncAnonymousMode();



// V153: o checkout herda automaticamente a cor real do botão de envio da campanha.
// Isso evita configuração manual por campanha: qualquer página que use este JS e
// envie o formulário para /checkout.php leva junto a cor renderizada do próprio CTA.
function checkoutThemeColorToHex(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const hex = raw.match(/^#([0-9a-f]{6})$/i);
  if (hex) return '#' + hex[1].toUpperCase();

  const nums = raw.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return '';
  if (nums.length >= 4 && Number(nums[3]) === 0) return '';
  const rgb = nums.slice(0, 3).map(v => Math.max(0, Math.min(255, Math.round(Number(v)))));
  if (rgb.some(v => !Number.isFinite(v))) return '';
  return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function checkoutThemeRenderedColor(style) {
  let color = checkoutThemeColorToHex(style?.backgroundColor || '');
  if (color) return color;
  const image = String(style?.backgroundImage || '');
  const firstGradientColor = image.match(/rgba?\([^)]*\)/i);
  return firstGradientColor ? checkoutThemeColorToHex(firstGradientColor[0]) : '';
}

function checkoutThemeUpsertHidden(form, name, value) {
  if (!form || !value) return;
  let field = form.querySelector(`input[type="hidden"][name="${name}"]`);
  if (!field) {
    field = document.createElement('input');
    field.type = 'hidden';
    field.name = name;
    form.appendChild(field);
  }
  field.value = value;
}

function syncCheckoutThemeFromCampaignButton(form) {
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
  if (!submitBtn) return;
  const style = window.getComputedStyle(submitBtn);
  const background = checkoutThemeRenderedColor(style);
  const foreground = checkoutThemeColorToHex(style.color);
  if (background) checkoutThemeUpsertHidden(form, 'checkout_theme_color', background);
  if (foreground) checkoutThemeUpsertHidden(form, 'checkout_theme_text_color', foreground);
}

const checkoutThemeForm = document.getElementById('donation-form') || document.querySelector('form[action*="checkout.php"]');
syncCheckoutThemeFromCampaignButton(checkoutThemeForm);

/* V68: IC é tratado somente pela UTMify via S2S Postback. */

document.getElementById('donation-form')?.addEventListener('submit', e => {
  const form = e.currentTarget;
  syncCheckoutThemeFromCampaignButton(form);
  const anonymous = Boolean(anonymousToggle?.checked);
  const n = donorNameInput?.value.trim() || '';
  const v = Number(String(amountInput?.value || '').replace('.','').replace(',','.'));

  // Garante o estado correto mesmo se o usuário clicar em enviar logo após marcar.
  if (donorNameInput) {
    donorNameInput.required = false;
    donorNameInput.disabled = anonymous;
  }

  // V113: validação amigável sem sair da página.
  if (!anonymous && !isValidDonorName(n)) {
    e.preventDefault();
    showNameError();
    return;
  }

  const configuredMinimum = Number(form?.dataset?.minAmount || amountInput?.min || 20);
  const minimumAmount = Number.isFinite(configuredMinimum) && configuredMinimum > 0 ? configuredMinimum : 20;
  if (!Number.isFinite(v) || v < minimumAmount) {
    e.preventDefault();
    alert('Informe um valor mínimo de R$ ' + minimumAmount.toFixed(2).replace('.', ',') + '.');
    return;
  }

  const configuredMaximum = Number(form?.dataset?.maxAmount || amountInput?.max || 1001);
  const maximumAmount = Number.isFinite(configuredMaximum) && configuredMaximum > 0 ? configuredMaximum : 1001;
  if (v > maximumAmount) {
    e.preventDefault();
    alert(
      'O valor máximo permitido é R$ ' +
      maximumAmount.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) +
      '.'
    );
    return;
  }

  clearNameError();

  // Trava instantaneamente o formulário no primeiro envio.
  // Isso evita múltiplos POSTs enquanto a API do PIX está respondendo.
  if (form.dataset.submitting === '1') {
    e.preventDefault();
    return;
  }
  form.dataset.submitting = '1';

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-disabled', 'true');
    submitBtn.dataset.originalText = submitBtn.textContent || '';
    submitBtn.textContent = 'Gerando PIX...';
    submitBtn.style.cursor = 'wait';
    submitBtn.style.opacity = '0.72';
  }

  // Bloqueia também Enter/clicks repetidos nos demais controles enquanto envia.
  form.querySelectorAll('button, input, select, textarea').forEach(el => {
    if (el !== submitBtn && el.type !== 'hidden') el.setAttribute('data-submit-locked', '1');
  });
});

const ttpField = document.getElementById('ttp-cookie');
if (ttpField) {
  const m = document.cookie.match(/(?:^|;\s*)_ttp=([^;]+)/);
  if (m) ttpField.value = decodeURIComponent(m[1]);
}


// V19: abas da página de campanha.
const campaignTabs = Array.from(document.querySelectorAll('[data-campaign-tab]'));
const campaignPanels = Array.from(document.querySelectorAll('[data-campaign-panel]'));
campaignTabs.forEach(tab => tab.addEventListener('click', () => {
  const target = tab.dataset.campaignTab;
  campaignTabs.forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
  campaignPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.campaignPanel === target));
}));


// V44: persistência de atribuição de tráfego para o pedido.
// Mantém campanha/conjunto/anúncio mesmo se o visitante navegar/recarregar antes de gerar o PIX.
(() => {
  const form = document.getElementById('donation-form');
  if (!form) return;

  const storageKey = 'checkout_attribution_v44';
  const ttl = 24 * 60 * 60 * 1000;
  const params = new URLSearchParams(location.search);

  const map = {
    src: ['src'],
    sck: ['sck'],
    utm_source: ['utm_source'],
    utm_campaign: ['utm_campaign'],
    utm_medium: ['utm_medium'],
    utm_content: ['utm_content'],
    utm_term: ['utm_term'],
    utm_id: ['utm_id'],
    traffic_campaign_id: ['campaign_id'],
    traffic_campaign_name: ['campaign_name'],
    adgroup_id: ['adgroup_id'],
    adgroup_name: ['adgroup_name'],
    ad_id: ['ad_id'],
    ad_name: ['ad_name'],
    creative_id: ['creative_id'],
    creative_name: ['creative_name'],
    placement: ['placement'],
    ttclid: ['ttclid']
  };

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
    if (!saved.saved_at || Date.now() - Number(saved.saved_at) > ttl) saved = {};
  } catch (_) { saved = {}; }

  // V154: um novo clique de anúncio nunca pode herdar campanha/conjunto
  // de uma visita anterior. Marcadores fortes indicam uma nova atribuição.
  const freshClickParams = [
    'ttclid','utm_campaign','utm_medium','utm_id',
    'campaign_id','campaign_name','adgroup_id','adgroup_name','ad_id'
  ];
  const hasFreshAttribution = freshClickParams.some(key =>
    (params.get(key) || '').trim() !== ''
  );
  if (hasFreshAttribution) saved = {};

  const current = {...saved};
  Object.entries(map).forEach(([field, queryNames]) => {
    for (const q of queryNames) {
      const value = (params.get(q) || '').trim();
      if (value) {
        current[field] = value;
        break;
      }
    }
  });

  const splitTikTokNameId = rawValue => {
    const raw = String(rawValue || '').trim();
    if (!raw) return {name:'', id:''};

    const parts = raw.split('|').map(v => v.trim());
    if (parts.length >= 2) {
      const candidateId = parts[parts.length - 1];
      const candidateName = parts.slice(0, -1).join('|').trim();
      if (/^\d{5,}$/.test(candidateId)) {
        return {name:candidateName, id:candidateId};
      }
    }
    return {name:raw, id:''};
  };

  const genericTrafficValues = new Set(['tiktok','ttk','paid','cpc','social','paid_social']);
  const usefulName = value => {
    const v = String(value || '').trim();
    return v !== ''
      && !genericTrafficValues.has(v.toLowerCase())
      && !/__[A-Z0-9_]+__/i.test(v);
  };

  const preferUtmName = (currentName, candidateName) => {
    const currentValue = String(currentName || '').trim();
    const candidateValue = String(candidateName || '').trim();
    if (!usefulName(candidateValue)) return currentValue;
    if (!usefulName(currentValue)) return candidateValue;

    // Só substitui um nome já válido quando a UTM claramente contém
    // informação mais completa. Assim não trocamos um nome bom por abreviação.
    if (candidateValue.length >= currentValue.length + 3) return candidateValue;
    if (candidateValue.toLowerCase().startsWith(currentValue.toLowerCase() + ' ')) return candidateValue;
    if (candidateValue.toLowerCase().startsWith(currentValue.toLowerCase() + '-')) return candidateValue;
    return currentValue;
  };

  // UTM atual é a fonte canônica quando ela é mais completa. Além de manter
  // a UTM bruta para exibição, gravamos nome/ID estruturados coerentes.
  const campaignFromUtm = splitTikTokNameId(current.utm_campaign);
  current.traffic_campaign_name = preferUtmName(current.traffic_campaign_name, campaignFromUtm.name);
  if (campaignFromUtm.id) current.traffic_campaign_id = campaignFromUtm.id;

  const adgroupFromUtm = splitTikTokNameId(current.utm_medium);
  current.adgroup_name = preferUtmName(current.adgroup_name, adgroupFromUtm.name);
  if (adgroupFromUtm.id) current.adgroup_id = adgroupFromUtm.id;

  if (Object.keys(current).some(k => k !== 'saved_at')) {
    current.saved_at = Date.now();
    try { localStorage.setItem(storageKey, JSON.stringify(current)); } catch (_) {}
  }

  Object.keys(map).forEach(field => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input && !input.value && current[field]) input.value = current[field];
  });

  const landingUrl = form.querySelector('[name="landing_url"]');
  const landingReferrer = form.querySelector('[name="landing_referrer"]');
  if (landingUrl) landingUrl.value = location.href.slice(0, 2000);
  if (landingReferrer) landingReferrer.value = (document.referrer || '').slice(0, 2000);
})();
