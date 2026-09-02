import { useState, useMemo } from 'react';
import { MapaSPSVG } from './components/MapaSPSVG';
import { useAeroportosFromBD, useRegionaisDisponiveis } from './hooks/useAeroportosFromBD';
import { PainelComAbas } from '@/components/PainelComAbas';
import { EmConstrucao } from '@/components/EmConstrucao';

interface DashboardSVGProps {
  activeTab?: 'operacao' | 'engenharia';
  activeMenuItem?: string;
}

export default function DashboardSVG({ activeTab, activeMenuItem }: DashboardSVGProps) {
  console.log('%c🟢 DashboardSVG renderizado', 'color: lime; font-weight: bold');

  const isPainelOperacao = activeTab === 'operacao' && activeMenuItem === 'Painel';

  const [filtro, setFiltro] = useState<'todos' | 'VOA-SP' | 'VOA-SE'>('todos');
  const [busca, setBusca] = useState('');
  const [regionalFilter, setRegionalFilter] = useState<string>('todas');
  const [selectedAeroporto, setSelectedAeroporto] = useState<any>(null);
  const [painelAberto, setPainelAberto] = useState(true);

  // Logging do estado quando muda
  const handleSelectAeroporto = (aeroporto: any) => {
    console.log('%c📍 DashboardSVG: setSelectedAeroporto chamado com:', 'color: #06b6d4; font-weight: bold', aeroporto);
    setSelectedAeroporto(aeroporto);
  };

  // Busca dados dos aeroportos
  const { data: aeroportos = [], isLoading: aeroportosLoading } = useAeroportosFromBD();
  const { data: regionais = [] } = useRegionaisDisponiveis();

  // Filtra aeroportos baseado nos filtros
  const aeroportosFiltrados = useMemo(() => {
    return aeroportos.filter((aero: any) => {
      // Filtro de concessão
      if (filtro !== 'todos' && aero.concessao !== filtro) return false;

      // Filtro de regional
      if (regionalFilter !== 'todas' && aero.regional !== regionalFilter) return false;

      // Filtro de busca
      if (busca) {
        const searchLower = busca.toLowerCase();
        return (
          aero.icao?.toLowerCase().includes(searchLower) ||
          aero.nome?.toLowerCase().includes(searchLower) ||
          aero.cidade?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [aeroportos, filtro, regionalFilter, busca]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0f0f1e',
      overflow: 'hidden',
    }}>
      {/* MAP + PANEL AREA */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#0f0f1e',
      }}>
        {/* LEFT - MAP (Flex 1) */}
        <div style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#1a1f2e',
        }}>
          {isPainelOperacao ? (
            <MapaSPSVG
              aeroportos={aeroportosFiltrados}
              onSelectAeroporto={handleSelectAeroporto}
              isLoading={aeroportosLoading}
            />
          ) : (
            <EmConstrucao label={activeMenuItem ?? ''} />
          )}
        </div>

        {/* RIGHT - PANEL (340px, recolhível) */}
        <div style={{ position: 'relative', height: '100%' }}>
          <div style={{
            width: painelAberto ? '340px' : '0px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1e293b',
            borderLeft: painelAberto ? '1px solid #2d3e50' : 'none',
            overflow: 'auto',
            boxShadow: painelAberto ? '-2px 0 8px rgba(0, 0, 0, 0.5)' : 'none',
            transition: 'width 0.3s ease',
          }}>
            {isPainelOperacao ? (
              <PainelComAbas
                selectedAeroporto={selectedAeroporto}
              />
            ) : (
              <EmConstrucao label={activeMenuItem ?? ''} compact />
            )}
          </div>

          {/* Botão de fechar/abrir na borda lateral do painel */}
          <button
            onClick={() => setPainelAberto((v) => !v)}
            title="Fechar/Expandir Painel"
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              transform: 'translate(-50%, -50%)',
              width: 20,
              height: 36,
              borderRadius: 6,
              border: '1px solid #2d3e50',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
              zIndex: 30,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#2d3e50';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
            }}
          >
            {painelAberto ? '▶' : '◀'}
          </button>
        </div>
      </div>

      {/* FILTERS SECTION */}
      {isPainelOperacao && (
      <div style={{
        backgroundColor: '#1e293b',
        borderTop: '1px solid #2d3e50',
        padding: '12px 16px',
        color: '#94a3b8',
        fontSize: '12px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
      }}>
        {/* Concessão Filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: '#06b6d4', fontSize: '11px', fontWeight: 'bold' }}>
            Concessão
          </label>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as any)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#0f0f1e',
              color: '#22c55e',
              border: '1px solid #2d3e50',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          >
            <option value="todos">Todos</option>
            <option value="VOA-SP">VOA-SP</option>
            <option value="VOA-SE">VOA-SE</option>
          </select>
        </div>

        {/* Regional Filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: '#06b6d4', fontSize: '11px', fontWeight: 'bold' }}>
            Regional
          </label>
          <select
            value={regionalFilter}
            onChange={(e) => setRegionalFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#0f0f1e',
              color: '#22c55e',
              border: '1px solid #2d3e50',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          >
            <option value="todas">Todas</option>
            {regionais.map((r: any) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Search Filter */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', color: '#06b6d4', fontSize: '11px', fontWeight: 'bold' }}>
            Busca
          </label>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="ICAO, nome ou cidade..."
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#0f0f1e',
              color: '#22c55e',
              border: '1px solid #2d3e50',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          />
        </div>
      </div>
      )}
    </div>
  );
}
