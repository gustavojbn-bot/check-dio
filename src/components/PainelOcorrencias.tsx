import React, { useState } from 'react';
import { Ocorrencia } from '@/types/Ocorrencia';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PainelOcorrenciasProps {
  ocorrencias: Ocorrencia[];
  isLoading?: boolean;
  /** chamado após uma exclusão bem-sucedida, para o pai recarregar a lista */
  onDeleted?: () => void;
}

export function PainelOcorrencias({ ocorrencias, isLoading, onDeleted }: PainelOcorrenciasProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleOcorrencia = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
        ⏳ Carregando ocorrências...
      </div>
    );
  }

  if (ocorrencias.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
        ✅ Nenhuma ocorrência no momento
      </div>
    );
  }

  // Ordenar por data (mais recente primeiro) e severidade
  const ocorrenciasOrdenadas = [...ocorrencias].sort((a, b) => {
    const severidadeOrder = { crítica: 0, alta: 1, média: 2, baixa: 3 };
    return (
      severidadeOrder[b.severidade as keyof typeof severidadeOrder] -
      severidadeOrder[a.severidade as keyof typeof severidadeOrder]
    );
  });

  return (
    <div style={{ padding: '8px 0' }}>
      {ocorrenciasOrdenadas.map((oc) => (
        <OcorrenciaBox
          key={oc.id}
          ocorrencia={oc}
          isExpanded={expandedIds.has(oc.id)}
          onToggle={() => toggleOcorrencia(oc.id)}
          onDeleted={onDeleted}
        />
      ))}
      <div style={{ height: 8 }} />
    </div>
  );
}

/**
 * Componente individual de ocorrência (caixa retrátil)
 */
function OcorrenciaBox({
  ocorrencia,
  isExpanded,
  onToggle,
  onDeleted,
}: {
  ocorrencia: Ocorrencia;
  isExpanded: boolean;
  onToggle: () => void;
  onDeleted?: () => void;
}) {
  const { podeEditar, podeExcluir } = useAuth();
  const [excluindo, setExcluindo] = useState(false);
  const severidadeColor = getSeveridadeColor(ocorrencia.severidade);
  const statusIndicador = getStatusIndicador(ocorrencia.status);
  const tipoEmoji = getTipoEmoji(ocorrencia.tipo);

  const handleExcluir = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Excluir esta ocorrência? Essa ação não pode ser desfeita.')) return;

    setExcluindo(true);
    const { error } = await supabase.from('ocorrencias').delete().eq('id', ocorrencia.id);
    setExcluindo(false);

    if (error) {
      console.error('%c[PainelOcorrencias] ❌ Erro ao excluir:', 'color: #ef4444', error);
      alert('Não foi possível excluir a ocorrência.');
      return;
    }
    onDeleted?.();
  };

  const handleEditar = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: abrir formulário de edição quando o schema da tabela `ocorrencias` for definido
    console.log('[PainelOcorrencias] Editar ocorrência', ocorrencia.id);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: 'rgba(100, 116, 139, 0.05)',
          border: `1px solid ${severidadeColor}`,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
          (e.currentTarget as HTMLElement).style.borderColor = severidadeColor;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(100, 116, 139, 0.05)';
        }}
      >
        {/* Indicador de Severidade */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: severidadeColor,
            flexShrink: 0,
          }}
        />

        {/* Ícone de Expansão */}
        <span
          style={{
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s',
            fontSize: 12,
            color: '#06b6d4',
          }}
        >
          ▼
        </span>

        {/* Título Principal */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#e2e8f0',
              marginBottom: 2,
            }}
          >
            {tipoEmoji} {ocorrencia.titulo}
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8' }}>
            {ocorrencia.icao} • {ocorrencia.data}
          </div>
        </div>

        {/* Status Indicador */}
        <div
          style={{
            fontSize: 11,
            color: statusIndicador.cor,
            fontWeight: 600,
            minWidth: '70px',
            textAlign: 'right',
          }}
        >
          {statusIndicador.emoji} {statusIndicador.label}
        </div>
      </button>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(6, 182, 212, 0.05)',
            borderLeft: `3px solid ${severidadeColor}`,
            borderRadius: '0 6px 6px 0',
            marginTop: 4,
            fontSize: 9,
            lineHeight: '1.5',
          }}
        >
          {/* Tipo e Status */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 8,
              paddingBottom: 8,
              borderBottom: '1px solid #2d3e50',
            }}
          >
            <InfoChip label="Tipo" value={ocorrencia.tipo} />
            <InfoChip label="Severidade" value={ocorrencia.severidade} color={severidadeColor} />
            <InfoChip label="Status" value={ocorrencia.status} />
          </div>

          {/* Descrição */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Descrição:</div>
            <div style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{ocorrencia.descricao}</div>
          </div>

          {/* Dados Adicionais (se existir) */}
          {(ocorrencia.dataInicio || ocorrencia.dataFim || ocorrencia.impacto) && (
            <div style={{ marginBottom: 8, paddingTop: 8, borderTop: '1px solid #2d3e50' }}>
              {ocorrencia.dataInicio && (
                <InfoRow label="Início" value={ocorrencia.dataInicio} />
              )}
              {ocorrencia.dataFim && (
                <InfoRow label="Previsão de Fim" value={ocorrencia.dataFim} />
              )}
              {ocorrencia.responsavel && (
                <InfoRow label="Responsável" value={ocorrencia.responsavel} />
              )}
              {ocorrencia.impacto && (
                <InfoRow label="Impacto Operacional" value={ocorrencia.impacto} />
              )}
            </div>
          )}

          {/* Observações */}
          {ocorrencia.observacoes && (
            <div style={{ paddingTop: 8, borderTop: '1px solid #2d3e50' }}>
              <div style={{ color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Observações:</div>
              <div style={{ color: '#cbd5e1', fontStyle: 'italic' }}>{ocorrencia.observacoes}</div>
            </div>
          )}

          {/* Ações — visíveis apenas para níveis de acesso autorizados */}
          {(podeEditar || podeExcluir) && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                paddingTop: 10,
                marginTop: 8,
                borderTop: '1px solid #2d3e50',
              }}
            >
              {podeEditar && (
                <button onClick={handleEditar} style={acaoButtonStyle('#3b82f6')}>
                  ✏️ Editar
                </button>
              )}
              {podeExcluir && (
                <button
                  onClick={handleExcluir}
                  disabled={excluindo}
                  style={acaoButtonStyle('#ef4444', excluindo)}
                >
                  {excluindo ? 'Excluindo...' : '🗑️ Excluir'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Estilo dos botões de ação (editar/excluir)
 */
function acaoButtonStyle(cor: string, disabled = false): React.CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: 4,
    border: `1px solid ${cor}`,
    backgroundColor: `${cor}1a`,
    color: cor,
    fontSize: 10,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}

/**
 * Componente auxiliar - Linha de informação
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4,
        fontSize: 9,
      }}
    >
      <span style={{ color: '#94a3b8', fontWeight: 500 }}>{label}:</span>
      <span style={{ color: '#cbd5e1', flex: 1, marginLeft: 8, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Componente auxiliar - Chip de informação
 */
function InfoChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: '2px 6px',
        backgroundColor: 'rgba(100, 116, 139, 0.1)',
        borderRadius: 3,
        border: `1px solid ${color || '#64748b'}`,
      }}
    >
      <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 9, color: color || '#e2e8f0', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

/**
 * Mapear severidade para cor
 */
function getSeveridadeColor(severidade: string): string {
  const cores = {
    crítica: '#ef4444', // Vermelho
    alta: '#f59e0b', // Amarelo/Amber
    média: '#3b82f6', // Azul
    baixa: '#10b981', // Verde
  };
  return cores[severidade as keyof typeof cores] || '#64748b';
}

/**
 * Mapear status para indicador
 */
function getStatusIndicador(status: string): {
  emoji: string;
  label: string;
  cor: string;
} {
  const indicadores = {
    ativa: { emoji: '🔴', label: 'Ativa', cor: '#ef4444' },
    pendente: { emoji: '🟡', label: 'Pendente', cor: '#f59e0b' },
    resolvida: { emoji: '🟢', label: 'Resolvida', cor: '#10b981' },
  };
  return (
    indicadores[status as keyof typeof indicadores] || {
      emoji: '⚪',
      label: 'Desconhecido',
      cor: '#64748b',
    }
  );
}

/**
 * Mapear tipo para emoji
 */
function getTipoEmoji(tipo: string): string {
  const emojis = {
    Manutenção: '🔧',
    Acidente: '⚠️',
    Cancelamento: '❌',
    Restrição: '🚫',
    Outro: '📋',
  };
  return emojis[tipo as keyof typeof emojis] || '📌';
}
