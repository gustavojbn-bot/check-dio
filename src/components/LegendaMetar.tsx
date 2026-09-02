import React from 'react';

export function LegendaMetar() {
  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: 'rgba(15, 15, 30, 0.95)',
        border: '1px solid #06b6d4',
        borderRadius: 8,
        padding: '12px 16px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: '#06b6d4',
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        📊 Legenda METAR
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 12, whiteSpace: 'nowrap' }}>
        {/* BOM - Verde */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
            }}
          />
          <div style={{ fontSize: 11, color: '#e2e8f0' }}>
            BOM (≥5000m/1500ft)
          </div>
        </div>

        {/* ATENÇÃO - Amarelo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
            }}
          />
          <div style={{ fontSize: 11, color: '#e2e8f0' }}>
            ATENÇÃO (1500-5000m/600-1500ft)
          </div>
        </div>

        {/* CRÍTICO - Vermelho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#ef4444',
            }}
          />
          <div style={{ fontSize: 11, color: '#e2e8f0' }}>
            CRÍTICO (&lt;1500m/600ft)
          </div>
        </div>

        {/* SEM DADOS - Preto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#000000',
              border: '1px solid #64748b',
            }}
          />
          <div style={{ fontSize: 11, color: '#e2e8f0' }}>
            SEM DADOS
          </div>
        </div>
      </div>
    </div>
  );
}
