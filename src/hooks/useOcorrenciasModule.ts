import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbAny } from '@/hooks/useOcorrenciaMatriz';
import { useAeroportosFromBD } from '@/hooks/useAeroportosFromBD';
import { useClassificacoes } from '@/hooks/useOcorrenciaMatriz';

export interface OcorrenciaRow {
  id: string;
  titulo: string;
  local: string;
  descricao: string;
  severidade: string;
  status: string;
  hora_ocorrencia: string | null;
  criado_em: string;
  aeroporto_id: string | null;
  classificacao_id: string | null;
  subclassificacao_id: string | null;
  documentos_status: { feito: boolean }[] | null;
}

export interface FiltrosOcorrencias {
  periodoInicio: string; // yyyy-mm-dd
  periodoFim: string;
  regional: string; // 'todas' | valor
  aeroportoId: string; // 'todos' | uuid
  classificacaoId: string; // 'todas' | uuid
  status: string; // 'todos' | aberto | em_andamento | resolvido
  severidade: string; // 'todas' | baixa | media | alta | critica
  busca: string;
}

function isoData(d: Date) {
  return d.toISOString().slice(0, 10);
}

function periodoPadrao(): { inicio: string; fim: string } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return { inicio: isoData(inicio), fim: isoData(hoje) };
}

function filtrosIniciais(): FiltrosOcorrencias {
  const { inicio, fim } = periodoPadrao();
  return {
    periodoInicio: inicio,
    periodoFim: fim,
    regional: 'todas',
    aeroportoId: 'todos',
    classificacaoId: 'todas',
    status: 'todos',
    severidade: 'todas',
    busca: '',
  };
}

/** Estado + dados compartilhados entre o painel central (filtros/dashboard/
 * botão novo) e o painel lateral (lista) da tela de Ocorrências. */
export function useOcorrenciasModule(ativo: boolean = true) {
  const [filtros, setFiltros] = useState<FiltrosOcorrencias>(filtrosIniciais);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [ocorrenciaSelecionadaId, setOcorrenciaSelecionadaId] = useState<string | null>(null);

  const { data: aeroportos = [] } = useAeroportosFromBD();
  const classificacoes = useClassificacoes();

  const todas = useQuery({
    queryKey: ['ocorrencias', filtros.periodoInicio, filtros.periodoFim],
    enabled: ativo,
    queryFn: async (): Promise<OcorrenciaRow[]> => {
      const inicioIso = new Date(`${filtros.periodoInicio}T00:00:00`).toISOString();
      const fimIso = new Date(`${filtros.periodoFim}T23:59:59`).toISOString();
      const { data, error } = await dbAny
        .from('ocorrencias')
        .select(
          'id, titulo, local, descricao, severidade, status, hora_ocorrencia, criado_em, aeroporto_id, classificacao_id, subclassificacao_id, documentos_status',
        )
        .gte('criado_em', inicioIso)
        .lte('criado_em', fimIso)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const regionais = useMemo(
    () => Array.from(new Set(aeroportos.map((a: any) => a.regional).filter(Boolean))) as string[],
    [aeroportos],
  );

  const aeroportosFiltrados = useMemo(
    () => aeroportos.filter((a: any) => filtros.regional === 'todas' || a.regional === filtros.regional),
    [aeroportos, filtros.regional],
  );

  const rows = useMemo(() => {
    const buscaLower = filtros.busca.trim().toLowerCase();
    return (todas.data ?? []).filter((o) => {
      const aero = aeroportos.find((a: any) => a.id === o.aeroporto_id);
      if (filtros.regional !== 'todas' && aero?.regional !== filtros.regional) return false;
      if (filtros.aeroportoId !== 'todos' && o.aeroporto_id !== filtros.aeroportoId) return false;
      if (filtros.classificacaoId !== 'todas' && o.classificacao_id !== filtros.classificacaoId) return false;
      if (filtros.status !== 'todos' && o.status !== filtros.status) return false;
      if (filtros.severidade !== 'todas' && o.severidade !== filtros.severidade) return false;
      if (buscaLower) {
        const alvo = `${o.titulo} ${o.local} ${aero?.icao ?? ''}`.toLowerCase();
        if (!alvo.includes(buscaLower)) return false;
      }
      return true;
    });
  }, [todas.data, filtros, aeroportos]);

  const aeroportoNome = (id: string | null) => {
    const a = aeroportos.find((x: any) => x.id === id);
    return a ? `${a.icao} · ${a.cidade}` : '—';
  };

  const classificacaoNome = (id: string | null) => classificacoes.data?.find((c) => c.id === id)?.nome ?? '—';

  const abrirNova = () => {
    setOcorrenciaSelecionadaId(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (id: string) => {
    setOcorrenciaSelecionadaId(id);
    setDialogAberto(true);
  };

  const fecharDialog = () => setDialogAberto(false);

  return {
    filtros,
    setFiltros,
    regionais,
    aeroportos,
    aeroportosFiltrados,
    classificacoes: classificacoes.data ?? [],
    rows,
    isLoading: todas.isLoading,
    refetch: todas.refetch,
    aeroportoNome,
    classificacaoNome,
    dialogAberto,
    ocorrenciaSelecionadaId,
    abrirNova,
    abrirEdicao,
    fecharDialog,
  };
}

export type OcorrenciasModule = ReturnType<typeof useOcorrenciasModule>;
