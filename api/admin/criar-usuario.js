import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

const NIVEIS_VALIDOS = ['administrador', 'operador', 'visualizador'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

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

  return res.status(200).json({
    success: true,
    usuario: { id: novoUsuario.user.id, nome, email, telefone: telefone || null, nivel_acesso },
  });
}
