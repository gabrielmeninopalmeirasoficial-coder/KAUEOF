# 🚀 GUIA DE CONFIGURAÇÃO - Vizzionpay PIX Backend no Render

## 📋 O que você precisa fazer:

### 1️⃣ CLONAR/SINCRONIZAR O REPOSITÓRIO NO RENDER

#### Opção A: Se você já tem o backend no Render
1. Abra https://dashboard.render.com
2. Clique no seu serviço `pix-backend-4c35`
3. Vá em **Settings** → **Source**
4. Sincronize com o GitHub para puxar os novos arquivos (`server.js`, `package.json`, `.env.example`)

#### Opção B: Se está criando do zero
1. Acesse https://dashboard.render.com
2. Clique em **New +** → **Web Service**
3. Selecione o repositório `gabrielmeninopalmeirasoficial-coder/KAUEOF`
4. Configure como abaixo

---

### 2️⃣ CONFIGURAR O SERVIÇO NO RENDER

**Nome do Serviço:**
```
pix-backend-vizzionpay
```

**Ambiente:**
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Node Version:** 18

---

### 3️⃣ ADICIONAR VARIÁVEIS DE AMBIENTE

No dashboard do Render, vá em **Settings** → **Environment** e adicione:

```
VIZZION_CLIENT_ID=hojesimdeusestacomigo23_l2om3e295x0uw6nl
VIZZION_CLIENT_SECRET=cxj5x84cfiobzn5ezhc4pwmkqexzl71tlworfv1qfozcvykqk8bixyyoxozh25ba
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://resplendent-marigold-902c11.netlify.app
BACKUP_PIX_KEY=sua_chave_pix_static_aqui
```

⚠️ **IMPORTANTE:** Nunca commite o `.env` com dados reais no GitHub!

---

### 4️⃣ TESTAR A INTEGRAÇÃO

Depois que o Render deploy for feito, teste a URL:

```bash
# Terminal ou Postman
curl -X POST https://pix-backend-4c35.onrender.com/ \
  -H "Content-Type: application/json" \
  -d '{"amountCents": 5000}'
```

Você deve receber uma resposta assim:
```json
{
  "success": true,
  "pixCopyPaste": "00020126580014br.gov.bcb.pix...",
  "qrCode": "https://api.qrserver.com/v1/create-qr-code/...",
  "transactionId": "TRX_123456789",
  "expiresAt": "2024-09-14T18:00:00Z"
}
```

---

### 5️⃣ INCLUIR O SCRIPT NO SEU HTML

No seu `index[1].html`, adicione antes da tag `</body>`:

```html
<!-- Script de Checkout PIX com Vizzionpay -->
<script src="https://raw.githubusercontent.com/gabrielmeninopalmeirasoficial-coder/KAUEOF/main/pix-checkout.js"></script>
```

Ou copie o conteúdo de `pix-checkout.js` diretamente em uma tag `<script>` no seu HTML.

---

### 6️⃣ CRIAR BOTÕES DE DOAÇÃO

Adicione botões com `data-amount` no seu HTML:

```html
<!-- Botões de valores predefinidos -->
<button class="btn-donate" data-amount="5000" data-label="R$ 50,00">
  Doar R$ 50
</button>

<button class="btn-donate" data-amount="10000" data-label="R$ 100,00">
  Doar R$ 100
</button>

<!-- Ou use onclick direto -->
<button onclick="vizzionPixAbrirModal(5000, 'R$ 50,00')">
  Gerar PIX
</button>
```

---

## 🔍 TROUBLESHOOTING

### ❌ Erro: "Cannot POST /"
- Verifique se o `server.js` foi deployado
- Teste com `curl -X POST https://pix-backend-4c35.onrender.com/`

### ❌ Erro: "CORS error"
- Adicione sua URL Netlify em `ALLOWED_ORIGINS`
- Reinicie o serviço no Render

### ❌ Erro: "Vizzionpay authentication failed"
- Verifique as credenciais no `.env`
- Confirme se a API Vizzionpay está ativa

### ❌ Modal não abre
- Verifique se `pix-checkout.js` foi carregado (F12 → Console)
- Confirme que `BACKEND_URL` no script aponta para a URL correta

---

## 📞 SUPORTE VIZZIONPAY

- **Documentação:** https://docs.vizzionpay.com
- **Dashboard:** https://dashboard.vizzionpay.com
- **Email:** suporte@vizzionpay.com

---

## ✅ CHECKLIST FINAL

- [ ] Arquivos criados: `server.js`, `package.json`, `pix-checkout.js`
- [ ] Render configurado com variáveis de ambiente
- [ ] Backend deployado com sucesso
- [ ] Script `pix-checkout.js` incluído no HTML
- [ ] Botões de doação configurados
- [ ] Teste de POST funcionando
- [ ] Modal aparecendo ao clicar no botão

🎉 **Pronto! Seu sistema de PIX com Vizzionpay está funcionando!**
