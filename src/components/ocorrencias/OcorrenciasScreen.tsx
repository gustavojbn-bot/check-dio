import { useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAeroportosFromBD } from '@/hooks/useAeroportosFromBD';
import { useClassificacoes } from '@/hooks/useOcorrenciaMatriz';
import { dbAny } from '@/hooks/useOcorrenciaMatriz';
import { severidadeLabel, severidadeCor } from '@/lib/severidade';
import { OcorrenciaFormDialog } from './OcorrenciaFormDialog';

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
};

const STATUS_COR: Record<string, string> = {
  aberto: '#ef4444',
  em_andamento: '#f59e0b',
  resolvido: '#22c55e',
};

interface OcorrenciaRow {
  id: string;
  titulo: string;
  local: string;
  severidade: string;
  status: string;
  hora_ocorrencia: string | null;
  criado_em: string;
  aeroporto_id: string | null;
  classificacao_id: string | null;
  documentos_status: { feito: boolean }[] | null;
}

function fmtData(v: string | null) {
  if (!v) return '—';
  return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** Tela de "Ocorrências" do menu Operação: lista + registro/edição via modal. */
export function OcorrenciasScreen() {
  const { podeInserir } = useAuth();
  const { data: aeroportos } = useAeroportosFromBD();
  const classificacoes = useClassificacoes();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [ocorrenciaSelecionadaId, setOcorrenciaSelecionadaId] = useState<string | null>(null);

  const ocorrencias = useQuery({
    queryKey: ['ocorrencias'],
    queryFn: async (): Promise<OcorrenciaRow[]> => {
      const { data, error } = await dbAny
        .from('ocorrencias')
        .select('id, titulo, local, severidade, status, hora_ocorrencia, criado_em, aeroporto_id, classificacao_id, documentos_status')
        .order('criado_em', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const abrirNova = () => {
    setOcorrenciaSelecionadaId(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (id: string) => {
    setOcorrenciaSelecionadaId(id);
    setDialogAberto(true);
  };

  const aeroportoNome = (id: string | null) => {
    const a = aeroportos?.find((x) => x.id === id);
    return a ? `${a.icao} · ${a.cidade}` : '—';
  };

  const classificacaoNome = (id: string | null) => classificacoes.data?.find((c) => c.id === id)?.nome ?? '—';

  const rows = ocorrencias.data ?? [];

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0f0f1e', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>⚠️ Ocorrências</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {ocorrencias.isLoading ? 'Carregando...' : `${rows.length} registro(s)`}
          </div>
        </div>
        {podeInserir && (
          <button onClick={abrirNova} style={botaoPrimarioStyle}>
            + Nova ocorrência
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.length === 0 && !ocorrencias.isLoading && (
          <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: 12 }}>Nenhuma ocorrência registrada.</div>
        )}

        {rows.map((o) => {
          const docs = o.documentos_status ?? [];
          const feitos = docs.filter((d) => d.feito).length;
          return (
            <button key={o.id} onClick={() => abrirEdicao(o.id)} style={linhaStyle}>
              <div style={{ minWidth: 110, fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                {fmtData(o.hora_ocorrencia ?? o.criado_em)}
              </div>
              <div style={{ minWidth: 130, fontSize: 11, color: '#94a3b8' }}>{aeroportoNome(o.aeroporto_id)}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{o.titulo}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{classificacaoNome(o.classificacao_id)}</div>
              </div>
              <span style={{ ...badgeStyle, borderColor: severidadeCor(o.severidade), color: severidadeCor(o.severidade) }}>
                {severidadeLabel(o.severidade)}
              </span>
              <span style={{ ...badgeStyle, borderColor: STATUS_COR[o.status] ?? '#64748b', color: STATUS_COR[o.status] ?? '#94a3b8' }}>
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
              {docs.length > 0 && (
                <span style={{ fontSize: 10, color: feitos < docs.length ? '#fbbf24' : '#4ade80', minWidth: 34, textAlign: 'right' }}>
                  {feitos}/{docs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {dialogAberto && (
        <OcorrenciaFormDialog
          ocorrenciaId={ocorrenciaSelecionadaId}
          onClose={() => setDialogAberto(false)}
          onSalvo={() => ocorrencias.refetch()}
        />
      )}
    </div>
  );
}

const botaoPrimarioStyle: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#06b6d4',
  color: '#0f0f1e',
  fontWeight: 700,
  fontSize: 12,
  cursor: 'pointer',
};

const linhaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: '#1e293b',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  flexWrap: 'wrap',
};

const badgeStyle: CSSProperties = {
  padding: '3px 8px',
  borderRadius: 4,
  border: '1px solid',
  fontSize: 10,
  fontWeight: 700,
  flexShrink: 0,
};
