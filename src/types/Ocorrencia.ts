/**
 * types/Ocorrencia.ts
 */
export interface Ocorrencia {
  id: string;
  aeroporto_icao?: string;
  icao?: string;
  tipo: string;
  titulo?: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  descricao: string;
  data: string;
  hora?: string;
  status: 'aberta' | 'fechada' | 'pendente' | 'ativa' | 'resolvida';
  dataInicio?: string;
  dataFim?: string;
  responsavel?: string;
  impacto?: string;
  observacoes?: string;
}

export interface OcorrenciasData {
  icao: string;
  total: number;
  ocorrencias: Ocorrencia[];
  isLoading?: boolean;
}
