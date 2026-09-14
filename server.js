const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 🔐 CREDENCIAIS VIZZIONPAY - APENAS NO BACKEND
const VIZZION_CLIENT_ID = process.env.VIZZION_CLIENT_ID || 'hojesimdeusestacomigo23_l2om3e295x0uw6nl';
const VIZZION_CLIENT_SECRET = process.env.VIZZION_CLIENT_SECRET || 'cxj5x84cfiobzn5ezhc4pwmkqexzl71tlworfv1qfozcvykqk8bixyyoxozh25ba';
const VIZZION_API_URL = 'https://api.vizzionpay.com'; // Ajuste conforme documentação da Vizzionpay

// Função para gerar token de acesso
async function getVizzionToken() {
  try {
    const response = await axios.post(
      `${VIZZION_API_URL}/oauth2/token`,
      {
        grant_type: 'client_credentials',
        client_id: VIZZION_CLIENT_ID,
        client_secret: VIZZION_CLIENT_SECRET,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Erro ao obter token Vizzionpay:', error.response?.data || error.message);
    throw new Error('Falha ao autenticar com Vizzionpay');
  }
}

// Função para gerar PIX via Vizzionpay
async function generatePixWithVizzion(amountCents, recipientName = 'Kauê') {
  try {
    const token = await getVizzionToken();
    
    const response = await axios.post(
      `${VIZZION_API_URL}/pix/generate`,
      {
        amount: amountCents,
        description: `Doação para ${recipientName}`,
        expiresIn: 1800, // 30 minutos
        customer: {
          name: recipientName,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      pixCopyPaste: response.data.qrcode_copy_paste || response.data.brCode,
      qrCode: response.data.qrcode_image_url || response.data.qrCode,
      transactionId: response.data.transaction_id || response.data.id,
      expiresAt: response.data.expires_at,
    };
  } catch (error) {
    console.error('Erro ao gerar PIX:', error.response?.data || error.message);
    
    // Fallback - se Vizzionpay falhar, tenta usar chave estática como backup
    console.log('Usando chave PIX estática como backup...');
    return {
      pixCopyPaste: process.env.BACKUP_PIX_KEY || '12345678901234567890123456789012345678901234',
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(process.env.BACKUP_PIX_KEY || '12345678901234567890123456789012345678901244')}`,
      transactionId: 'BACKUP_' + Date.now(),
      expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      isBackup: true,
    };
  }
}

// ✅ ENDPOINT PRINCIPAL
app.post('/', async (req, res) => {
  try {
    const { amountCents } = req.body;

    if (!amountCents || amountCents <= 0) {
      return res.status(400).json({
        error: 'Valor inválido',
        message: 'O valor deve ser maior que 0',
      });
    }

    // Gerar PIX via Vizzionpay
    const pixData = await generatePixWithVizzion(amountCents);

    return res.json({
      success: true,
      pixCopyPaste: pixData.pixCopyPaste,
      qrCode: pixData.qrCode,
      transactionId: pixData.transactionId,
      expiresAt: pixData.expiresAt,
      isBackup: pixData.isBackup || false,
    });
  } catch (error) {
    console.error('Erro no endpoint:', error);
    return res.status(500).json({
      error: 'Erro ao gerar PIX',
      message: error.message,
    });
  }
});

// ✅ ENDPOINT DE VERIFICAÇÃO DE STATUS
app.get('/pix/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const token = await getVizzionToken();

    const response = await axios.get(
      `${VIZZION_API_URL}/pix/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return res.json({
      success: true,
      status: response.data.status,
      paidAt: response.data.paid_at,
      amount: response.data.amount,
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Erro ao verificar PIX',
      message: error.message,
    });
  }
});

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log('✅ Integração Vizzionpay ativa');
});
