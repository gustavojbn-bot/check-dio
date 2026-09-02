import { useIsMobile } from '@/hooks/useIsMobile';

/**
 * Cabeçalho exibido acima do mapa (área escura): logo grande + nome do
 * sistema. Se auto-ajusta (tamanho de logo, fonte e espaçamento) em telas
 * de celular.
 */
export function MapaHeader() {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '2px 12px 1px' : '3px 16px 2px',
        gap: 0,
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      {/* Wrapper corta a margem transparente que existe no próprio arquivo da
          logo (acima/abaixo do desenho), senão sobra um espaço vazio grande
          mesmo com gap pequeno. */}
      <div
        style={{
          width: isMobile ? '68%' : '38%',
          maxWidth: isMobile ? 260 : 420,
          minWidth: isMobile ? 160 : 220,
          aspectRatio: '4.9 / 1',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <img
          src="/Logo-checkdio-3d.png"
          alt="Check DIO - Rede VOA - Departamento de Infraestrutura e Operações"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 'auto',
            transform: 'translateY(-32%)',
            objectFit: 'contain',
          }}
        />
      </div>
      <div
        style={{
          fontSize: isMobile ? 10.5 : 16,
          fontWeight: 700,
          color: '#cbd5e1',
          letterSpacing: '0.5px',
          maxWidth: isMobile ? '90%' : '80%',
        }}
      >
        SISTEMA DE GESTÃO DEPARTAMENTO DE INFRAESTRUTURA E OPERAÇÕES
      </div>
    </div>
  );
}
