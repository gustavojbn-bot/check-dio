import type { CSSProperties } from 'react';
import { severidadeLabel, severidadeCor } from '@/lib/severidade';
import type { OcorrenciasModule } from '@/hooks/useOcorrenciasModule';

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

function fmtData(v: string | null) {
  if (!v) return '—';
  return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** Lista de ocorrências no painel direito (mesmo slot do painel de dados do
 * aeroporto selecionado no mapa), refletindo os filtros do painel central. */
export function OcorrenciasListaPanel({ modulo }: { modulo: OcorrenciasModule }) {
  const { rows, isLoading, abrirEdicao } = modulo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1e293b' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #2d3e50' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>Lista de ocorrências</div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
          {isLoading ? 'Carregando...' : `${rows.length} registro(s)`}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.length === 0 && !isLoading && (
          <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 11 }}>
            Nenhuma ocorrência no período/filtros atuais.
          </div>
        )}

        {rows.map((o) => {
          const docs = o.documentos_status ?? [];
          const feitos = docs.filter((d) => d.feito).length;
          return (
            <button key={o.id} onClick={() => abrirEdicao(o.id)} style={linhaStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>{o.titulo}</span>
                <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>
                  {fmtData(o.hora_ocorrencia ?? o.criado_em)}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{modulo.aeroportoNome(o.aeroporto_id)}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{modulo.classificacaoNome(o.classificacao_id)}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...badgeStyle, borderColor: severidadeCor(o.severidade), color: severidadeCor(o.severidade) }}>
                  {severidadeLabel(o.severidade)}
                </span>
                <span style={{ ...badgeStyle, borderColor: STATUS_COR[o.status] ?? '#64748b', color: STATUS_COR[o.status] ?? '#94a3b8' }}>
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
                {docs.length > 0 && (
                  <span style={{ fontSize: 9, color: feitos < docs.length ? '#fbbf24' : '#4ade80' }}>
                    📋 {feitos}/{docs.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const linhaStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: '#0f0f1e',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
};

const badgeStyle: CSSProperties = {
  padding: '2px 6px',
  borderRadius: 4,
  border: '1px solid',
  fontSize: 9,
  fontWeight: 700,
};
