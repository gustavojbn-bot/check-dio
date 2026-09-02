import React, { useState } from 'react';
import type { PontoAeroporto } from '@/lib/aeroportos';
import { useMetarRotaer, getMetarColor } from '@/hooks/useMetarRotaer';
import { useTaf } from '@/hooks/useTaf';
import { parseTaf, getIndicadorLabel, type TafIndicador } from '@/utils/tafParser';
import { useRotaer } from '@/hooks/useRotaer';
import { useNotam } from '@/hooks/useNotam';
import { useCartas } from '@/hooks/useCartas';
import { useOcorrenciasAeroporto } from '@/hooks/useOcorrencias';
import { PainelOcorrencias } from './PainelOcorrencias';
import { ErrorBoundary } from './ErrorBoundary';

interface PainelComAbasProps {
  selectedAeroporto: PontoAeroporto | null;
}

type AbaAtiva = 'ocorrencias' | 'painel';

/**
 * Painel com 2 abas: Ocorrências e Painel (dados do aeroporto)
 *
 * Comportamento:
 * - Inicial: Mostra aba "Ocorrências" com instrução de clicar em um aeroporto
 * - Ao clicar marcador: Painel aparece com aba "Ocorrências" ativa
 * - Usuário pode clicar em "Painel" para ver METAR, NOTAMs, Cartas e dados básicos
 * - Dados disponíveis: METAR, NOTAMs, Cartas, Ocorrências do aeroporto
 */
export function PainelComAbas({ selectedAeroporto }: PainelComAbasProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('ocorrencias');

  // Auto-switch para aba "Painel" quando um aeroporto é selecionado
  React.useEffect(() => {
    if (selectedAeroporto) {
      console.log(`[PainelComAbas] ✈️ Aeroporto selecionado: ${selectedAeroporto.icao} - Mudando para aba Painel`);
      setAbaAtiva('painel');
    } else {
      console.log(`[PainelComAbas] 🔄 Nenhum aeroporto selecionado - Voltando para aba Ocorrências`);
      setAbaAtiva('ocorrencias');
    }
  }, [selectedAeroporto]);

  // Renderizar sempre com abas, independente de aeroporto selecionado ou não
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#1e293b',
      borderLeft: '1px solid #2d3e50',
      overflow: 'hidden',
    }}>
      {/* ABAS */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #2d3e50',
        backgroundColor: '#0f0f1e',
      }}>
        <AbaButton
          label="Ocorrências"
          ativa={abaAtiva === 'ocorrencias'}
          onClick={() => setAbaAtiva('ocorrencias')}
        />
        <AbaButton
          label="Painel"
          ativa={abaAtiva === 'painel'}
          onClick={() => setAbaAtiva('painel')}
          disabled={!selectedAeroporto}
        />
      </div>

      {/* CONTEÚDO */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#0f0f1e',
        padding: '12px',
        color: '#94a3b8',
        fontSize: '12px',
        minHeight: 0,
      }}>
        {abaAtiva === 'ocorrencias' && (
          selectedAeroporto ? (
            <ErrorBoundary label="Ocorrências">
              <OcorrenciasAeroportoTab icao={selectedAeroporto.icao} />
            </ErrorBoundary>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              color: '#64748b',
              fontSize: '13px',
              textAlign: 'center',
              gap: '12px',
            }}>
              <div style={{ fontSize: '28px' }}>🗺️</div>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Selecione um aeroporto</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Clique em um marcador para ver ocorrências
                </div>
              </div>
            </div>
          )
        )}
        {abaAtiva === 'painel' && selectedAeroporto && (
          <ErrorBoundary label="Painel do aeroporto">
            <PainelAeroportoTab aeroporto={selectedAeroporto} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

/**
 * Botão de aba com suporte a disabled
 */
function AbaButton({
  label,
  ativa,
  onClick,
  disabled = false,
}: {
  label: string;
  ativa: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '12px 16px',
        backgroundColor: ativa ? '#1e293b' : 'transparent',
        border: 'none',
        borderBottom: ativa ? '2px solid #06b6d4' : '2px solid transparent',
        color: ativa ? '#06b6d4' : disabled ? '#475569' : '#64748b',
        fontSize: '12px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!ativa && !disabled) {
          (e.target as HTMLElement).style.color = '#94a3b8';
        }
      }}
      onMouseLeave={(e) => {
        if (!ativa && !disabled) {
          (e.target as HTMLElement).style.color = '#64748b';
        }
      }}
    >
      {label}
    </button>
  );
}

/**
 * Aba Ocorrências Gerais - mostra todas as ocorrências do sistema
 */
function OcorrenciasGeraisTab() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      flexDirection: 'column',
      color: '#64748b',
      fontSize: '13px',
      textAlign: 'center',
      gap: '12px',
    }}>
      <div style={{ fontSize: '28px' }}>📋</div>
      <div>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>Selecione um aeroporto</div>
        <div style={{ fontSize: '11px', color: '#475569' }}>
          Clique em um marcador para ver ocorrências específicas
        </div>
      </div>
    </div>
  );
}

/**
 * Aba Ocorrências do Aeroporto - mostra ocorrências específicas do aeroporto selecionado
 */
function OcorrenciasAeroportoTab({ icao }: { icao: string }) {
  const ocorrenciasData = useOcorrenciasAeroporto(icao);

  return (
    <div>
      {ocorrenciasData.total === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: '#64748b',
          fontSize: '12px',
        }}>
          ✅ Nenhuma ocorrência registrada
        </div>
      ) : (
        <PainelOcorrencias
          ocorrencias={ocorrenciasData.ocorrencias}
          isLoading={false}
          onDeleted={ocorrenciasData.refetch}
        />
      )}
    </div>
  );
}

/**
 * Aba Painel - mostra METAR, NOTAMs, Cartas e dados do aeroporto
 */
function PainelAeroportoTab({ aeroporto }: { aeroporto: PontoAeroporto }) {
  // Hooks para dados
  const { metar, isLoading: metarLoading } = useMetarRotaer(aeroporto.icao);
  const { taf, isLoading: tafLoading } = useTaf(aeroporto.icao);
  const { rotaer, isLoading: rotaerLoading } = useRotaer(aeroporto.icao);
  const { notamData, isLoading: notamLoading } = useNotam(aeroporto.icao);
  const { cartasData, isLoading: cartasLoading } = useCartas(aeroporto.icao);
  const ocorrenciasData = useOcorrenciasAeroporto(aeroporto.icao);

  // Debug: Logar dados recebidos
  console.log(`[PainelAeroportoTab] ${aeroporto.icao} - METAR:`, metar);
  console.log(`[PainelAeroportoTab] ${aeroporto.icao} - ROTAER:`, rotaer);
  console.log(`[PainelAeroportoTab] ${aeroporto.icao} - NOTAM Total:`, notamData?.total);
  console.log(`[PainelAeroportoTab] ${aeroporto.icao} - CARTAS Total:`, cartasData?.total);

  const metarColor = getMetarColor(metar?.status_metar);

  return (
    <div>
      {/* HEADER COM ICAO E METAR STATUS */}
      <div style={{
        borderBottom: '1px solid #2d3e50',
        backgroundColor: '#0f0f1e',
        padding: '12px',
        marginLeft: '-12px',
        marginTop: '-12px',
        marginRight: '-12px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#06b6d4',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            ✈️ {aeroporto.icao}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            fontFamily: 'monospace',
            marginTop: '4px',
            wordBreak: 'break-all',
          }}>
            {metarLoading ? 'Carregando METAR...' : (metar?.metar_bruto || 'METAR indisponível')}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          flexShrink: 0,
          marginLeft: '12px',
        }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: metarColor,
              opacity: metarLoading ? 0.5 : 1,
            }}
          />
          <span style={{ color: metarColor, fontWeight: '600', textTransform: 'uppercase' }}>
            {metarLoading ? 'Carregando...' : getMetarStatusLabel(metar?.status_metar)}
          </span>
        </div>
      </div>

      {/* SEÇÃO: DADOS BÁSICOS */}
      <SectionHeader title="Informações Básicas" icon="ℹ️" />
      <DataRow label="Nome" value={aeroporto.nome} />
      <DataRow label="Cidade" value={aeroporto.cidade} />
      <DataRow label="Regional" value={aeroporto.regional} />
      <DataRow label="Concessão" value={aeroporto.concessao} />

      {/* SEÇÃO: METAR */}
      <SectionHeader title="Status Meteorológico (METAR)" icon="🌤️" loading={metarLoading} />
      {metar?.status_metar === 'sem_dados' ? (
        <InfoBox type="warning">Dados METAR não disponíveis no momento</InfoBox>
      ) : (
        <>
          <DataRow label="Temperatura" value={metar?.temperatura_c ? `${metar.temperatura_c}°C` : 'N/A'} />
          <DataRow label="Visibilidade" value={metar?.visibilidade_m ? `${metar.visibilidade_m}m` : 'N/A'} />
          <DataRow label="Teto" value={metar?.teto_ft ? `${metar.teto_ft} ft` : 'N/A'} />
          <DataRow label="Vento" value={metar?.vento_velocidade_kt ? `${metar.vento_velocidade_kt} kt` : 'N/A'} />
          <DataRow label="Pressão" value={metar?.pressao_mb ? `${metar.pressao_mb} mb` : 'N/A'} />
        </>
      )}

      {/* SEÇÃO: TAF (Previsão de Aeródromo) */}
      <SectionHeader title="Previsão (TAF)" icon="📅" loading={tafLoading} />
      {!taf?.taf_bruto ? (
        <InfoBox type="info">Dados TAF não disponíveis no momento</InfoBox>
      ) : (
        <TafInterpretado tafBruto={taf.taf_bruto} />
      )}

      {/* SEÇÃO: ROTAER (Infraestrutura do Aeroporto) */}
      <SectionHeader title="Infraestrutura (ROTAER)" icon="🏗️" loading={rotaerLoading} />
      {!rotaer || Object.keys(rotaer).length === 0 ? (
        <InfoBox type="info">Dados ROTAER não disponíveis no momento</InfoBox>
      ) : (
        <>
          <DataRow label="Pistas" value={rotaer?.pistas ? String(rotaer.pistas) : 'N/A'} />
          <DataRow label="Tipo Operação" value={rotaer?.tipoOperacao ? String(rotaer.tipoOperacao) : 'N/A'} />
          <DataRow label="ACN/PCN" value={rotaer?.acnPcn ? String(rotaer.acnPcn) : 'N/A'} />
          <DataRow label="Frequências" value={rotaer?.frequencias && Array.isArray(rotaer.frequencias) ? rotaer.frequencias.join(', ') : 'N/A'} />
          <DataRow label="Auxílios à Navegação" value={rotaer?.navAids ? String(rotaer.navAids) : 'N/A'} />
          <DataRow label="PAPI" value={rotaer?.papi ? String(rotaer.papi) : 'N/A'} />
          <DataRow label="Iluminação" value={rotaer?.iluminacao ? 'Sim' : 'Não'} />
          <DataRow label="Combustível" value={rotaer?.combustivel && Array.isArray(rotaer.combustivel) ? rotaer.combustivel.join(', ') : 'N/A'} />
          <DataRow label="Serviços" value={rotaer?.servicos && Array.isArray(rotaer.servicos) ? rotaer.servicos.join(', ') : 'N/A'} />
        </>
      )}

      {/* SEÇÃO: NOTAMs */}
      <SectionHeader
        title={`NOTAMs (${notamData.total})`}
        icon="⚠️"
        loading={notamLoading}
      />
      {notamData.total === 0 ? (
        <InfoBox type="success">Nenhum NOTAM ativo</InfoBox>
      ) : (
        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
          {notamData.notams.map((notam) => (
            <div
              key={notam.id}
              style={{
                padding: '8px',
                marginBottom: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '2px solid #ef4444',
                borderRadius: '2px',
              }}
            >
              <div style={{ fontWeight: '600', color: '#fca5a5', marginBottom: '2px' }}>
                {notam.cod || notam.n || 'NOTAM'} - {notam.cat || 'SEM CATEGORIA'}
              </div>
              <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>
                {notam.tp && `Tipo: ${notam.tp}`}
                {notam.dt && ` | Publicado: ${notam.dt}`}
              </div>
              {(notam.b || notam.c) && (
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Vigência: {notam.b || '?'} até {notam.c || '?'}
                </div>
              )}
              {notam.d && (
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Horário: {notam.d}
                </div>
              )}
              {notam.e && (
                <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: '500' }}>
                  {notam.e}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SEÇÃO: CARTAS */}
      <SectionHeader
        title={`Cartas Aeronáuticas (${cartasData.total})`}
        icon="📄"
        loading={cartasLoading}
      />
      {cartasData.total === 0 ? (
        <InfoBox type="info">Nenhuma carta disponível</InfoBox>
      ) : (
        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
          {cartasData.cartas.map((carta) => (
            <div
              key={carta.id}
              style={{
                padding: '8px',
                marginBottom: '6px',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                borderLeft: '2px solid #06b6d4',
                borderRadius: '2px',
              }}
            >
              <div style={{ fontWeight: '600', color: '#67e8f9', marginBottom: '2px' }}>
                {carta.nome}
              </div>
              <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>
                Tipo: {carta.tipo_descr || carta.tipo} | Data: {carta.dt}
              </div>
              {carta.link && (
                <a
                  href={carta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '10px',
                    color: '#0ea5e9',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  📥 Download
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SEÇÃO: OCORRÊNCIAS */}
      <SectionHeader title={`Ocorrências (${ocorrenciasData.total})`} icon="⚠️" />
      {ocorrenciasData.total === 0 ? (
        <InfoBox type="success">Nenhuma ocorrência registrada</InfoBox>
      ) : (
        <PainelOcorrencias
          ocorrencias={ocorrenciasData.ocorrencias.slice(0, 2)}
          isLoading={false}
          onDeleted={ocorrenciasData.refetch}
        />
      )}
    </div>
  );
}

/**
 * Cabeçalho de seção
 */
function SectionHeader({
  title,
  icon,
  loading = false,
}: {
  title: string;
  icon: string;
  loading?: boolean;
}) {
  return (
    <div style={{
      marginTop: '16px',
      marginBottom: '8px',
      paddingBottom: '6px',
      borderBottom: '1px solid #2d3e50',
      fontSize: '12px',
      fontWeight: '600',
      color: '#06b6d4',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    }}>
      <span>{icon}</span>
      {title}
      {loading && <span style={{ fontSize: '10px', color: '#64748b' }}>⏳</span>}
    </div>
  );
}

/**
 * Linha de dados
 */
function DataRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '11px',
      paddingBottom: '4px',
      borderBottom: '1px solid rgba(45, 62, 80, 0.3)',
    }}>
      <span style={{ color: '#94a3b8', fontWeight: '500' }}>{label}</span>
      <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{value || 'N/A'}</span>
    </div>
  );
}

/**
 * Caixa de informação
 */
function InfoBox({ type, children }: { type: 'success' | 'warning' | 'info'; children: React.ReactNode }) {
  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#86efac' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#fcd34d' },
    info: { bg: 'rgba(6, 182, 212, 0.1)', border: '#06b6d4', text: '#67e8f9' },
  };

  const color = colors[type];

  return (
    <div style={{
      padding: '8px 12px',
      marginBottom: '8px',
      backgroundColor: color.bg,
      borderLeft: `2px solid ${color.border}`,
      borderRadius: '2px',
      fontSize: '11px',
      color: color.text,
    }}>
      {children}
    </div>
  );
}

const TAF_INDICADOR_COR: Record<TafIndicador, string> = {
  INICIAL: '#64748b',
  BECMG: '#3b82f6',
  TEMPO: '#f59e0b',
  FM: '#a855f7',
  PROB30: '#f97316',
  PROB40: '#f97316',
};

/**
 * Interpreta e exibe o TAF de forma legível: cabeçalho (aeródromo/emissão/validade),
 * um cartão por período previsto (inicial + mudanças BECMG/TEMPO/FM/PROB) com
 * vento/visibilidade/nuvens decodificados, temperaturas extremas e, por fim, a
 * mensagem bruta para referência.
 */
function TafInterpretado({ tafBruto }: { tafBruto: string }) {
  const taf = parseTaf(tafBruto);

  if (!taf || !taf.icao) {
    return (
      <div style={{
        fontSize: '11px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        padding: '8px 12px',
        marginBottom: '8px',
        backgroundColor: 'rgba(148, 163, 184, 0.08)',
        borderLeft: '2px solid #64748b',
        borderRadius: '2px',
        wordBreak: 'break-all',
      }}>
        {tafBruto}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      <DataRow label="Emissão" value={taf.emissao || 'N/A'} />
      <DataRow label="Validade" value={taf.validadeInicio && taf.validadeFim ? `${taf.validadeInicio} até ${taf.validadeFim}` : 'N/A'} />
      {taf.temperaturaMaxima && (
        <DataRow label="Temp. máxima" value={`${taf.temperaturaMaxima.valor}°C (${taf.temperaturaMaxima.quando})`} />
      )}
      {taf.temperaturaMinima && (
        <DataRow label="Temp. mínima" value={`${taf.temperaturaMinima.valor}°C (${taf.temperaturaMinima.quando})`} />
      )}

      {taf.periodos.map((periodo, i) => (
        <div
          key={i}
          style={{
            padding: '8px',
            marginTop: '8px',
            backgroundColor: `${TAF_INDICADOR_COR[periodo.indicador]}1a`,
            borderLeft: `2px solid ${TAF_INDICADOR_COR[periodo.indicador]}`,
            borderRadius: '2px',
          }}
        >
          <div style={{ fontWeight: '600', fontSize: '11px', color: TAF_INDICADOR_COR[periodo.indicador], marginBottom: '2px' }}>
            {getIndicadorLabel(periodo.indicador)}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
            {periodo.periodoTexto}
          </div>
          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
            {periodo.vento && <div>Vento: {periodo.vento}</div>}
            {periodo.visibilidade && <div>Visibilidade: {periodo.visibilidade}</div>}
            {periodo.nuvens && <div>Nuvens: {periodo.nuvens}</div>}
            {!periodo.vento && !periodo.visibilidade && !periodo.nuvens && (
              <div style={{ fontFamily: 'monospace', fontSize: '10px' }}>{periodo.bruto}</div>
            )}
          </div>
        </div>
      ))}

      <div style={{
        fontSize: '10px',
        color: '#64748b',
        fontFamily: 'monospace',
        padding: '8px 12px',
        marginTop: '8px',
        backgroundColor: 'rgba(148, 163, 184, 0.08)',
        borderLeft: '2px solid #64748b',
        borderRadius: '2px',
        wordBreak: 'break-all',
      }}>
        {taf.taf_bruto}
      </div>
    </div>
  );
}

/**
 * Mapear status METAR para label legível
 */
function getMetarStatusLabel(status: string | undefined): string {
  switch (status?.toLowerCase()) {
    case 'bom':
    case 'vfr':
      return 'BOM';
    case 'atencao':
    case 'mvfr':
      return 'ATENÇÃO';
    case 'critico':
    case 'ifr':
    case 'lifr':
      return 'CRÍTICO';
    case 'sem_dados':
    default:
      return 'SEM DADOS';
  }
}
