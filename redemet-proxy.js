import express from 'express';
import cors from 'cors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega .env e .env.local manualmente (este script roda com `node`, fora do Vite,
// que é quem normalmente lê os arquivos .env*)
function carregarEnv(nomeArquivo) {
  try {
    const envContent = readFileSync(join(__dirname, nomeArquivo), 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    });
  } catch {
    // arquivo ausente - segue com variáveis já definidas no ambiente, se houver
  }
}
carregarEnv('.env');
carregarEnv('.env.local');

const app = express();
const PORT = process.env.PORT || 3001;

// API Keys (definidas em .env.local, sem prefixo VITE_ - nunca vão para o navegador)
const REDEMET_API_KEY = process.env.REDEMET_API_KEY;
const ROTAER_API_KEY = process.env.ROTAER_API_KEY;
const ROTAER_API_PASS = process.env.ROTAER_API_PASS;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!REDEMET_API_KEY || !ROTAER_API_KEY || !ROTAER_API_PASS) {
  console.error('❌ REDEMET_API_KEY / ROTAER_API_KEY / ROTAER_API_PASS não configuradas em .env.local');
  process.exit(1);
}

// Cliente Supabase com service_role - só existe no servidor, nunca no navegador.
// Usado para validar sessões de admin e criar novos usuários (Auth Admin API).
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

if (!supabaseAdmin) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY não configurada - endpoint /api/admin/criar-usuario ficará indisponível');
}

// API URLs
const REDEMET_BASE_URL_NOVO = 'https://api-redemet.decea.mil.br/mensagens/metar';
const REDEMET_BASE_URL_ANTIGO = 'https://api-redemet.decea.gov.br/api/metar';
const TAF_BASE_URL_NOVO = 'https://api-redemet.decea.mil.br/mensagens/taf';
const TAF_BASE_URL_ANTIGO = 'https://api-redemet.decea.gov.br/api/taf';
const ROTAER_BASE_URL = 'https://api.decea.mil.br/aisweb';

// Middleware
app.use(cors());
app.use(express.json());

/**
 * GET /api/metar/:icao
 */
app.get('/api/metar/:icao', async (req, res) => {
  const icao = req.params.icao.toUpperCase();
  const { data_ini, data_fim } = req.query;

  console.log(`[METAR] Searching for ${ icao }...`);

  try {
    const url = `${ REDEMET_BASE_URL_NOVO }/${ icao }?data_ini=${ data_ini || '2026080100' }&data_fim=${ data_fim || '2026083100' }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': REDEMET_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.ok) {
      const data = await response.text();
      try {
        const parsed = JSON.parse(data);
        return res.json({
          success: true,
          data: parsed,
          endpoint: 'NOVO (.mil.br)',
          statusCode: 200
        });
      } catch (e) {
        return res.json({
          success: true,
          data: { raw: data },
          endpoint: 'NOVO (.mil.br)',
          statusCode: 200
        });
      }
    }
    console.log(`[METAR] Fallback to antigo...`);
  } catch (error) {
    console.warn(`[METAR] Error: ${ error.message }`);
  }

  // Fallback
  try {
    const url = `${ REDEMET_BASE_URL_ANTIGO }/${ icao }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': REDEMET_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.ok) {
      const data = await response.text();
      try {
        const parsed = JSON.parse(data);
        return res.json({
          success: true,
          data: parsed,
          endpoint: 'ANTIGO (.gov.br)',
          statusCode: 200
        });
      } catch (e) {
        return res.json({
          success: true,
          data: { raw: data },
          endpoint: 'ANTIGO (.gov.br)',
          statusCode: 200
        });
      }
    }

    return res.status(response.status).json({
      success: false,
      error: `RedMET returned ${ response.status }`,
      icao,
      endpoint: 'ANTIGO (.gov.br)'
    });

  } catch (error) {
    console.error(`[METAR] Error: ${ error.message }`);
    return res.status(500).json({
      success: false,
      error: error.message,
      icao
    });
  }
});

/**
 * GET /api/taf/:icao
 */
app.get('/api/taf/:icao', async (req, res) => {
  const icao = req.params.icao.toUpperCase();
  const { data_ini, data_fim } = req.query;

  console.log(`[TAF] Searching for ${ icao }...`);

  try {
    const url = `${ TAF_BASE_URL_NOVO }/${ icao }?data_ini=${ data_ini || '2026080100' }&data_fim=${ data_fim || '2026083100' }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': REDEMET_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.ok) {
      const data = await response.text();
      try {
        const parsed = JSON.parse(data);
        return res.json({
          success: true,
          data: parsed,
          endpoint: 'NOVO (.mil.br)',
          statusCode: 200
        });
      } catch (e) {
        return res.json({
          success: true,
          data: { raw: data },
          endpoint: 'NOVO (.mil.br)',
          statusCode: 200
        });
      }
    }
    console.log(`[TAF] Fallback to antigo...`);
  } catch (error) {
    console.warn(`[TAF] Error: ${ error.message }`);
  }

  // Fallback
  try {
    const url = `${ TAF_BASE_URL_ANTIGO }/${ icao }`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': REDEMET_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.ok) {
      const data = await response.text();
      try {
        const parsed = JSON.parse(data);
        return res.json({
          success: true,
          data: parsed,
          endpoint: 'ANTIGO (.gov.br)',
          statusCode: 200
        });
      } catch (e) {
        return res.json({
          success: true,
          data: { raw: data },
          endpoint: 'ANTIGO (.gov.br)',
          statusCode: 200
        });
      }
    }

    return res.status(response.status).json({
      success: false,
      error: `RedMET returned ${ response.status }`,
      icao,
      endpoint: 'ANTIGO (.gov.br)'
    });

  } catch (error) {
    console.error(`[TAF] Error: ${ error.message }`);
    return res.status(500).json({
      success: false,
      error: error.message,
      icao
    });
  }
});

/**
 * GET /api/rotaer/:icao
 */
app.get('/api/rotaer/:icao', async (req, res) => {
  const icao = req.params.icao.toUpperCase();
  const { area = 'rotaer', rowstart = 0, rowend = 100 } = req.query;

  try {
    const url = `${ ROTAER_BASE_URL }/?apiKey=${ ROTAER_API_KEY }&apiPass=${ ROTAER_API_PASS }&area=${ area }&icaoCode=${ icao }&rowstart=${ rowstart }&rowend=${ rowend }`;

    const response = await fetch(url, {
      timeout: 10000,
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `ROTAER returned ${ response.status }`,
        icao,
        area
      });
    }

    const data = await response.text();
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(data);

  } catch (error) {
    console.error(`[ROTAER] Error: ${ error.message }`);
    res.status(500).json({
      success: false,
      error: error.message,
      icao
    });
  }
});

/**
 * POST /api/admin/criar-usuario
 * Cria um novo usuário no Supabase Auth + perfil, com nível de acesso definido.
 * Só pode ser chamado por um administrador autenticado.
 * Body: { nome, email, senha, telefone?, nivel_acesso }
 */
app.post('/api/admin/criar-usuario', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ success: false, error: 'Serviço de administração indisponível (SUPABASE_SERVICE_ROLE_KEY ausente)' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Não autenticado' });
  }

  // Valida a sessão de quem está chamando
  const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.getUser(token);
  if (sessionError || !sessionData?.user) {
    return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada' });
  }

  // Confirma que quem está chamando é administrador
  const { data: perfilSolicitante, error: perfilError } = await supabaseAdmin
    .from('perfis')
    .select('nivel_acesso')
    .eq('id', sessionData.user.id)
    .maybeSingle();

  if (perfilError || perfilSolicitante?.nivel_acesso !== 'administrador') {
    return res.status(403).json({ success: false, error: 'Apenas administradores podem criar usuários' });
  }

  const { nome, email, senha, telefone, nivel_acesso } = req.body || {};
  const NIVEIS_VALIDOS = ['administrador', 'operador', 'visualizador'];

  if (!nome || !email || !senha || !nivel_acesso) {
    return res.status(400).json({ success: false, error: 'Campos obrigatórios: nome, email, senha, nivel_acesso' });
  }
  if (!NIVEIS_VALIDOS.includes(nivel_acesso)) {
    return res.status(400).json({ success: false, error: `nivel_acesso deve ser um de: ${NIVEIS_VALIDOS.join(', ')}` });
  }
  if (senha.length < 6) {
    return res.status(400).json({ success: false, error: 'A senha deve ter ao menos 6 caracteres' });
  }

  // Cria o usuário no Auth (a trigger on_auth_user_created já insere um perfil padrão)
  const { data: novoUsuario, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, telefone: telefone || null },
  });

  if (createError) {
    console.error('[admin/criar-usuario] Erro ao criar usuário:', createError.message);
    return res.status(400).json({ success: false, error: createError.message });
  }

  // Garante nome/telefone/nível corretos no perfil (a trigger cria com nível 'visualizador' por padrão)
  // e marca senha_provisoria=true para exigir a troca no primeiro acesso do usuário.
  const { error: updateError } = await supabaseAdmin
    .from('perfis')
    .update({ nome, telefone: telefone || null, nivel_acesso, senha_provisoria: true })
    .eq('id', novoUsuario.user.id);

  if (updateError) {
    console.error('[admin/criar-usuario] Usuário criado mas falhou ao definir perfil:', updateError.message);
    return res.status(500).json({ success: false, error: `Usuário criado, mas falhou ao definir o perfil: ${updateError.message}` });
  }

  return res.json({
    success: true,
    usuario: { id: novoUsuario.user.id, nome, email, telefone: telefone || null, nivel_acesso },
  });
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    endpoints: [
      'GET /api/metar/:icao',
      'GET /api/taf/:icao',
      'GET /api/rotaer/:icao',
      'POST /api/admin/criar-usuario',
      'GET /health'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${ PORT }`);
  console.log(`Press Ctrl+C to stop`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});