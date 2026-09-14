(() => {
  'use strict';
  const s = document.createElement('script');
  s.src = 'https://cdn.utmify.com.br/scripts/utms/latest.js';
  s.async = true;
  s.defer = true;
  s.setAttribute('data-utmify-prevent-xcod-sck', '');
  s.setAttribute('data-utmify-prevent-subids', '');
  (document.head || document.documentElement).appendChild(s);
})();
