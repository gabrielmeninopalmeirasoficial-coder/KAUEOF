(function () {
  // ⚙️ CONFIGURAÇÕES
  const BACKEND_URL = 'https://pix-backend-4c35.onrender.com';
  
  // 🎨 HTML DO MODAL
  var modalHTML = '<div id="vizzion-pix-modal" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);align-items:center;justify-content:center;">'
    + '<div style="background:#fff;border-radius:12px;padding:28px 24px;max-width:360px;width:94%;text-align:center;position:relative;font-family:\'DM Sans\', Lato,sans-serif;">'
    + '<button onclick="vizzionPixFecharModal()" style="position:absolute;top:10px;right:14px;background:none;border:none;font-size:22px;color:#888;cursor:pointer;line-height:1;">×</button>'
    + '<div style="margin-bottom:16px;">'
    + '<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(29,170,107,0.1);border:1px solid rgba(29,170,107,0.3);border-radius:100px;padding:4px 12px;font-size:11px;color:#1daa6b;font-weight:700;margin-bottom:10px;"><span style="width:6px;height:6px;background:#1daa6b;border-radius:50%;"></span> Vizzionpay PIX</div>'
    + '<h3 id="vizzion-titulo" style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a1a1a;">Gerando seu PIX...</h3>'
    + '<p id="vizzion-valor" style="margin:0;font-size:13px;color:#666;"></p>'
    + '</div>'
    + '<div id="vizzion-loading" style="padding:30px 0;">'
    + '<div style="width:40px;height:40px;border:3px solid #f0f0f0;border-top-color:#1daa6b;border-radius:50%;margin:0 auto 12px;animation:vizzionSpin 0.8s linear infinite;"></div>'
    + '<p style="color:#888;font-size:13px;margin:0;">Aguarde...</p>'
    + '</div>'
    + '<div id="vizzion-qr" style="display:none;">'
    + '<img id="vizzion-qr-img" src="" alt="QR Code PIX" style="width:200px;height:200px;margin:0 auto 14px;display:block;border-radius:8px;" />'
    + '<p style="font-size:12px;color:#666;margin:0 0 8px;">Ou copie o código PIX:</p>'
    + '<div style="display:flex;gap:8px;align-items:center;background:#f5f5f5;border-radius:8px;padding:8px 12px;margin-bottom:16px;">'
    + '<input id="vizzion-copia-cola" type="text" readonly style="flex:1;border:none;background:none;font-size:11px;color:#333;outline:none;font-family:monospace;" />'
    + '<button onclick="vizzionPixCopiarCodigo()" style="background:#1daa6b;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">Copiar</button>'
    + '</div>'
    + '<p id="vizzion-copiado" style="display:none;color:#1daa6b;font-size:12px;font-weight:700;margin:0 0 12px;">✓ Código copiado!</p>'
    + '<p style="font-size:11px;color:#aaa;margin:0;">O QR Code expira em 30 minutos.</p>'
    + '</div>'
    + '<div id="vizzion-erro" style="display:none;padding:16px 0;">'
    + '<p style="color:#e74c3c;font-size:14px;margin:0 0 12px;">Não foi possível gerar o PIX.<br>Tente novamente.</p>'
    + '<button onclick="vizzionPixFecharModal()" style="background:#e74c3c;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;">Fechar</button>'
    + '</div>'
    + '</div></div>'
    + '<style>@keyframes vizzionSpin{to{transform:rotate(360deg)}}</style>';

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // 🎯 FUNÇÃO PARA ABRIR MODAL E GERAR PIX
  window.vizzionPixAbrirModal = function (amountCents, labelValor) {
    var modal   = document.getElementById('vizzion-pix-modal');
    var loading = document.getElementById('vizzion-loading');
    var qrDiv   = document.getElementById('vizzion-qr');
    var erroDiv = document.getElementById('vizzion-erro');
    var titulo  = document.getElementById('vizzion-titulo');
    var valorEl = document.getElementById('vizzion-valor');

    loading.style.display = 'block';
    qrDiv.style.display   = 'none';
    erroDiv.style.display = 'none';
    titulo.textContent    = 'Gerando seu PIX...';
    valorEl.textContent   = 'Valor: ' + labelValor;
    modal.style.display   = 'flex';
    document.body.style.overflow = 'hidden';

    // 📡 REQUISIÇÃO AO BACKEND COM VIZZIONPAY
    fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountCents: amountCents })
    })
    .then(function (res) { 
      if (!res.ok) throw new Error('Resposta do servidor inválida');
      return res.json(); 
    })
    .then(function (data) {
      if (data && data.pixCopyPaste) {
        // 🖼️ GERAR QR CODE
        var qrCodeUrl = data.qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(data.pixCopyPaste);
        
        document.getElementById('vizzion-qr-img').src = qrCodeUrl;
        document.getElementById('vizzion-copia-cola').value = data.pixCopyPaste;
        
        titulo.textContent    = '✓ PIX gerado!';
        valorEl.textContent   = 'Valor: ' + labelValor;
        
        // Armazenar ID da transação para verificação posterior
        if (data.transactionId) {
          document.getElementById('vizzion-pix-modal').dataset.transactionId = data.transactionId;
        }
        
        loading.style.display = 'none';
        qrDiv.style.display   = 'block';
      } else {
        throw new Error('Resposta inválida: ' + JSON.stringify(data));
      }
    })
    .catch(function (error) {
      console.error('Erro ao gerar PIX:', error);
      loading.style.display = 'none';
      erroDiv.style.display = 'block';
    });
  };

  // ❌ FECHAR MODAL
  window.vizzionPixFecharModal = function () {
    document.getElementById('vizzion-pix-modal').style.display = 'none';
    document.body.style.overflow = '';
  };

  // 📋 COPIAR CÓDIGO PIX
  window.vizzionPixCopiarCodigo = function () {
    var input = document.getElementById('vizzion-copia-cola');
    navigator.clipboard.writeText(input.value).then(function () {
      document.getElementById('vizzion-copiado').style.display = 'block';
      setTimeout(function () {
        document.getElementById('vizzion-copiado').style.display = 'none';
      }, 2500);
    }).catch(function () {
      // Fallback para navegadores antigos
      input.select();
      document.execCommand('copy');
      document.getElementById('vizzion-copiado').style.display = 'block';
      setTimeout(function () {
        document.getElementById('vizzion-copiado').style.display = 'none';
      }, 2500);
    });
  };

  // 🔗 FECHAR AO CLICAR NO OVERLAY
  document.getElementById('vizzion-pix-modal').addEventListener('click', function (e) {
    if (e.target === this) vizzionPixFecharModal();
  });

  // 💰 MAPA DE VALORES PREDEFINIDOS (CUSTOMIZE CONFORME NECESSÁRIO)
  var mapaValores = {
    'doacao-30': { cents: 3000,   label: 'R$ 30,00'    },
    'doacao-50': { cents: 5000,   label: 'R$ 50,00'    },
    'doacao-70': { cents: 7000,   label: 'R$ 70,00'    },
    'doacao-100': { cents: 10000,  label: 'R$ 100,00'   },
    'doacao-150': { cents: 15000,  label: 'R$ 150,00'   },
    'doacao-200': { cents: 20000,  label: 'R$ 200,00'   },
    'doacao-300': { cents: 30000,  label: 'R$ 300,00'   },
    'doacao-500': { cents: 50000,  label: 'R$ 500,00'   },
    'doacao-700': { cents: 70000,  label: 'R$ 700,00'   },
    'doacao-1000': { cents: 100000, label: 'R$ 1.000,00' },
    'doacao-1500': { cents: 150000, label: 'R$ 1.500,00' },
    'doacao-2000': { cents: 200000, label: 'R$ 2.000,00' }
  };

  // 🔍 INTERCEPTAR CLIQUES EM LINKS DE DOAÇÃO
  function interceptarLinks() {
    // Detecta links com data-amount ou class com "donate"
    var links = document.querySelectorAll('[data-amount], .btn-donate, .doacao-link, [onclick*="vizzionPixAbrirModal"]');
    
    links.forEach(function (link) {
      if (link.dataset.vizzionBound) return; // Evitar duplicação
      link.dataset.vizzionBound = '1';
      
      link.addEventListener('click', function (e) {
        // Se já é um botão de doação com onclick, deixar funcionar normalmente
        if (link.hasAttribute('onclick')) return;
        
        e.preventDefault();
        e.stopImmediatePropagation();
        
        var amount = link.dataset.amount || link.getAttribute('data-amount');
        var label = link.dataset.label || link.textContent.trim();
        
        if (amount) {
          var cents = parseInt(amount);
          vizzionPixAbrirModal(cents, label);
        }
      }, true);
    });
  }

  // Executar na primeira vez
  document.addEventListener('DOMContentLoaded', interceptarLinks);
  
  // Observar mudanças no DOM para novas doações adicionadas dinamicamente
  new MutationObserver(interceptarLinks).observe(document.body, { childList: true, subtree: true });

})();
