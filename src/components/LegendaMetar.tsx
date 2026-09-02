import React from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';

export function LegendaMetar() {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'rgba(15, 15, 30, 0.95)',
        border: '1px solid #06b6d4',
        borderRadius: 8,
        padding: isMobile ? '8px 10px' : '12px 16px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        maxWidth: isMobile ? '92vw' : 'none',
      }}
    >
      <div
        style={{
          fontSize: isMobile ? 11 : 12,
          fontWeight: '700',
          color: '#06b6d4',
          marginBottom: isMobile ? 6 : 10,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        📊 Legenda METAR
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: isMobile ? 6 : 12,
          whiteSpace: isMobile ? 'normal' : 'nowrap',
        }}
      >
        {/* BOM - Verde */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8, minWidth: isMobile ? '46%' : undefined }}>
          <div
            style={{
              width: isMobile ? 9 : 12,
              height: isMobile ? 9 : 12,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: isMobile ? 9 : 11, color: '#e2e8f0' }}>
            BOM (≥5000m/1500ft)
          </div>
        </div>

        {/* ATENÇÃO - Amarelo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8, minWidth: isMobile ? '46%' : undefined }}>
          <div
            style={{
              width: isMobile ? 9 : 12,
              height: isMobile ? 9 : 12,
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: isMobile ? 9 : 11, color: '#e2e8f0' }}>
            ATENÇÃO (1500-5000m/600-1500ft)
          </div>
        </div>

        {/* CRÍTICO - Vermelho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8, minWidth: isMobile ? '46%' : undefined }}>
          <div
            style={{
              width: isMobile ? 9 : 12,
              height: isMobile ? 9 : 12,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: isMobile ? 9 : 11, color: '#e2e8f0' }}>
            CRÍTICO (&lt;1500m/600ft)
          </div>
        </div>

        {/* SEM DADOS - Preto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8, minWidth: isMobile ? '46%' : undefined }}>
          <div
            style={{
              width: isMobile ? 9 : 12,
              height: isMobile ? 9 : 12,
              borderRadius: '50%',
              backgroundColor: '#000000',
              border: '1px solid #64748b',
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: isMobile ? 9 : 11, color: '#e2e8f0' }}>
            SEM DADOS
          </div>
        </div>
      </div>
    </div>
  );
}
