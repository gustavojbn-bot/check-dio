interface EmConstrucaoProps {
  label: string;
  compact?: boolean;
}

/**
 * Placeholder exibido para itens de menu que ainda não têm tela própria
 * implementada (hoje só "Painel" de Operação tem conteúdo real).
 */
export function EmConstrucao({ label, compact = false }: EmConstrucaoProps) {
  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 8 : 12,
        color: '#64748b',
        padding: 16,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: compact ? 32 : 48 }}>🚧</div>
      <div style={{ fontSize: compact ? 13 : 16, fontWeight: 600, color: '#94a3b8' }}>
        {label}
      </div>
      <div style={{ fontSize: compact ? 11 : 12 }}>Em construção</div>
    </div>
  );
}
