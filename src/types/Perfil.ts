export type NivelAcesso = 'administrador' | 'operador' | 'visualizador';

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  nivel_acesso: NivelAcesso;
  senha_provisoria?: boolean;
  criado_em?: string;
}

export const NIVEL_DESCRICAO: Record<NivelAcesso, string> = {
  administrador: 'Acesso total: pode ler, inserir, editar e excluir registros em todo o sistema.',
  operador: 'Pode ler, inserir e editar registros, mas não pode excluir.',
  visualizador: 'Pode apenas visualizar/ler os dados, sem realizar alterações.',
};
