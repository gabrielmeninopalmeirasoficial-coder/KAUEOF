(() => {
  // IMPORTANT: absolute path. A relative "api/analytics.php" breaks on /campaign/123
  // because the browser resolves it as /campaign/api/analytics.php.
  const endpoint = '/api/analytics.php';

  const makeId = () => {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID().replaceAll('-', '');
    return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  };

  // One browser = one unique visitor per São Paulo calendar day.
  // This avoids counting page changes/reloads as new people while guaranteeing
  // that a visitor returning tomorrow is counted on the new day.
  const saoPauloDay = () => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(new Date());
      const get = type => parts.find(p => p.type === type)?.value || '';
      return `${get('year')}-${get('month')}-${get('day')}`;
    } catch (_) {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
  };

  const day = saoPauloDay();
  const dailyKey = `site_daily_visitor_v42_${day}`;
  let token = '';

  try {
    token = localStorage.getItem(dailyKey) || '';
    if (!token) {
      token = makeId();
      localStorage.setItem(dailyKey, token);

      // Remove old daily analytics keys so localStorage stays small.
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('site_daily_visitor_v42_') && k !== dailyKey) {
          localStorage.removeItem(k);
        }
      });
    }
  } catch (_) {
    // Browsers blocking localStorage still get analytics for the current page.
    token = makeId();
  }

  const params = new URLSearchParams(location.search);
  const payload = () => ({
    session: token,
    campaign_id: Number(window.ANALYTICS_CAMPAIGN_ID || 0),
    page: location.pathname,
    referrer: document.referrer || '',
    utm_source: params.get('utm_source') || '',
    utm_campaign: params.get('utm_campaign') || '',
    ttclid: params.get('ttclid') || ''
  });

  let pingBusy = false;
  const ping = async () => {
    if (pingBusy) return;
    pingBusy = true;
    try {
      await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload()),
        keepalive: true,
        cache: 'no-store'
      });
    } catch (_) {
    } finally {
      pingBusy = false;
    }
  };

  // Immediate presence, then heartbeat while the visitor is actually viewing the site.
  ping();
  const timer = setInterval(() => { if (!document.hidden) ping(); }, 10000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ping(); });
  window.addEventListener('focus', ping);
  window.addEventListener('pageshow', ping);
  window.addEventListener('pagehide', () => clearInterval(timer), {once:true});
})();
