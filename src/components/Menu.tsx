import { useState, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { GestaoUsuarios } from './GestaoUsuarios';

const MENU_ITEMS = {
  operacao: [
    'Painel',
    'Aeroportos',
    'Vistoria',
    'Ocorrências',
    'Eventos',
    'Alertas',
    'Manutenções',
    'Aeroportos inteligentes',
    'AMS — Pátio',
    'Gestão de Pessoas',
    'Registros',
    'REEs',
    'Relatórios',
    'Administração',
  ],
  engenharia: [
    'PGI Rede VOA',
    'Estratégias Rede VOA',
    'Medições',
    'Financeiro',
    'Pagamentos',
    'Jurídico',
    'Regulatório',
    'Licenças',
    'Projetos',
    'Manutenção',
    'Execução Obras',
    'Suprimentos',
  ],
};

const MENU_ICONS: Record<string, string> = {
  'Operação': '⚙️',
  'Engenharia': '🔧',
  'Painel': '📊',
  'Aeroportos': '✈️',
  'Vistoria': '🔍',
  'Ocorrências': '⚠️',
  'Eventos': '📅',
  'Alertas': '🔔',
  'Manutenções': '🔧',
  'Aeroportos inteligentes': '🤖',
  'AMS — Pátio': '📍',
  'Gestão de Pessoas': '👥',
  'Registros': '📝',
  'REEs': '📋',
  'Relatórios': '📈',
  'Administração': '⚙️',
  'PGI Rede VOA': '🎯',
  'Estratégias Rede VOA': '📐',
  'Medições': '📏',
  'Financeiro': '💰',
  'Pagamentos': '💳',
  'Jurídico': '⚖️',
  'Regulatório': '📜',
  'Licenças': '📄',
  'Projetos': '🏗️',
  'Manutenção': '🔨',
  'Execução Obras': '👷',
  'Suprimentos': '📦',
};

interface MenuProps {
  onMenuSelect?: (tab: 'operacao' | 'engenharia', item: string) => void;
  onMenuToggle?: (isOpen: boolean) => void;
}

export function Menu({ onMenuSelect, onMenuToggle }: MenuProps) {
  const queryClient = useQueryClient();
  const { nivelAcesso } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [gestaoUsuariosAberta, setGestaoUsuariosAberta] = useState(false);
  const [activeTab, setActiveTab] = useState<'operacao' | 'engenharia'>('operacao');
  const [activeItem, setActiveItem] = useState<string>(MENU_ITEMS.operacao[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const menuItems = useMemo(() => MENU_ITEMS[activeTab], [activeTab]);

  const handleMenuSelect = (item: string) => {
    setActiveItem(item);
    onMenuSelect?.(activeTab, item);
  };

  const handleMenuToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onMenuToggle?.(newState);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    console.log('🔄 Iniciando atualização de dados...');

    try {
      await queryClient.invalidateQueries({
        queryKey: ['metar'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['rotaer'],
        refetchType: 'active',
      });

      console.log('✅ Dados atualizados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        style={{
          width: isOpen ? 280 : 60,
          height: '100%',
          backgroundColor: '#1e293b',
          borderRight: '1px solid #2d3e50',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
        }}
      >
      {/* ==================== BOTÕES: REFRESH | ALERTAS | CONFIGURAÇÕES | USUÁRIOS ==================== */}
      <div
        style={{
          paddingLeft: '8px',
          paddingRight: '8px',
          paddingTop: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #2d3e50',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isOpen ? '16px' : '8px',
          minHeight: 40,
        }}
      >
        <IconButton
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Atualizar dados METAR/ROTAER"
          color="#06b6d4"
          spin={isRefreshing}
        >
          {isRefreshing ? '⟳' : '🔄'}
        </IconButton>

        <IconButton
          onClick={() => console.log('Alertas')}
          title="Alertas do Sistema"
          color="#f59e0b"
        >
          🔔
        </IconButton>

        <IconButton
          onClick={() => console.log('Configurações (a implementar)')}
          title="Configurações do Sistema (em breve)"
          color="#94a3b8"
        >
          ⚙️
        </IconButton>

        <IconButton
          onClick={() => setGestaoUsuariosAberta(true)}
          disabled={nivelAcesso !== 'administrador'}
          title={
            nivelAcesso === 'administrador'
              ? 'Gestão de Usuários'
              : 'Gestão de Usuários (apenas administradores)'
          }
          color="#a855f7"
        >
          👤
        </IconButton>
      </div>

      {gestaoUsuariosAberta && (
        <GestaoUsuarios onClose={() => setGestaoUsuariosAberta(false)} />
      )}


      {/* ==================== ABAS DE MENU ==================== */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #2d3e50',
        }}
      >
        {/* Aba Operação */}
        <button
          onClick={() => setActiveTab('operacao')}
          style={{
            flex: 1,
            padding: isOpen ? '10px 8px' : '10px 4px',
            borderRight: '1px solid #2d3e50',
            border: 'none',
            borderBottom: activeTab === 'operacao' ? '2px solid #22c55e' : 'none',
            backgroundColor: activeTab === 'operacao' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
            color: activeTab === 'operacao' ? '#22c55e' : '#94a3b8',
            fontSize: isOpen ? 12 : 14,
            fontWeight: activeTab === 'operacao' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isOpen ? '⚙️ Operação' : '⚙️'}
        </button>

        {/* Aba Engenharia */}
        <button
          onClick={() => setActiveTab('engenharia')}
          style={{
            flex: 1,
            padding: isOpen ? '10px 8px' : '10px 4px',
            border: 'none',
            borderBottom: activeTab === 'engenharia' ? '2px solid #3b82f6' : 'none',
            backgroundColor: activeTab === 'engenharia' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            color: activeTab === 'engenharia' ? '#3b82f6' : '#94a3b8',
            fontSize: isOpen ? 12 : 14,
            fontWeight: activeTab === 'engenharia' ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isOpen ? '🔧 Engenharia' : '🔧'}
        </button>
      </div>

      {/* ==================== ITENS DO MENU ==================== */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          paddingLeft: '8px',
          paddingRight: '8px',
          paddingTop: '0px',
          paddingBottom: '8px',
        }}
      >
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => handleMenuSelect(item)}
            style={{
              padding: isOpen ? '10px 12px' : '10px 8px',
              borderRadius: '4px',
              border: activeItem === item ? '1px solid #22c55e' : '1px solid #2d3e50',
              backgroundColor: activeItem === item ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
              color: activeItem === item ? '#22c55e' : '#94a3b8',
              fontSize: isOpen ? 11 : 10,
              fontWeight: activeItem === item ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: isOpen ? 8 : 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
            }}
            onMouseLeave={(e) => {
              if (activeItem !== item) {
                (e.target as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: isOpen ? 12 : 10 }}>
              {MENU_ICONS[item] || '📌'}
            </span>
            {isOpen && <span>{item}</span>}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      </div>

      {/* Botão de fechar/abrir na borda lateral do menu */}
      <button
        onClick={handleMenuToggle}
        title="Fechar/Expandir Menu"
        style={{
          position: 'absolute',
          top: '50%',
          left: isOpen ? 280 : 60,
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
          transition: 'left 0.3s ease, background-color 0.2s ease',
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
        {isOpen ? '◀' : '▶'}
      </button>
    </div>
  );
}

function IconButton({
  onClick,
  title,
  color,
  children,
  disabled = false,
  spin = false,
}: {
  onClick: () => void;
  title: string;
  color: string;
  children: ReactNode;
  disabled?: boolean;
  spin?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: `1px solid ${color}`,
        backgroundColor: `${color}1a`,
        color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.6 : 1,
        animation: spin ? 'spin 1s linear infinite' : 'none',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.backgroundColor = `${color}33`;
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = `${color}1a`;
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );
}
