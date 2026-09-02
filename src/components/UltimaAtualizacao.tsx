import { useEffect } from 'react';
import { useUltimaAtualizacao, useRegistrarAtualizacao } from '@/hooks/useUltimaAtualizacao';

/**
 * Indicador discreto no canto inferior esquerdo do mapa com a data/hora da
 * última atualização dos dados METAR/TAF/ROTAER. Se atualiza sozinho a cada
 * 10 minutos (mesmo ciclo dos hooks de dados) e também quando o usuário
 * clica no botão de refresh manual do menu.
 */
export function UltimaAtualizacao() {
  const timestamp = useUltimaAtualizacao();
  const registrar = useRegistrarAtualizacao();

  useEffect(() => {
    const interval = setInterval(() => registrar(), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [registrar]);

  const texto = new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 6,
        left: 8,
        fontSize: 9,
        color: 'rgba(148, 163, 184, 0.6)',
        zIndex: 20,
        pointerEvents: 'none',
        userSelect: 'none',
        fontFamily: 'monospace',
      }}
    >
      Atualizado em {texto}
    </div>
  );
}
