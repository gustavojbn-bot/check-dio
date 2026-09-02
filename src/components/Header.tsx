import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';

interface HeaderProps {
  activeTab: 'operacao' | 'engenharia';
  activeMenuItem: string;
}

const MENU_ICONS: Record<string, string> = {
  'Operação': '⚙️',
  'Engenharia': '🔧',
  'Situação Operacional': '📊',
  'Monitoramento de Voo': '✈️',
  'Despacho Aéreo': '📋',
  'Planejamento de Voo': '🗺️',
  'Rotas e Procedimentos': '🛤️',
  'Slots Aeroportuários': '⏰',
  'Padrões de Tráfego': '🔁',
  'Pistas e Taxiways': '🛫',
  'Sistema de Coordenação': '🔗',
  'Relatórios Operacionais': '📄',
  'Atendimento ao Cliente': '👥',
  'Emergências e Segurança': '🚨',
  'Gestão de Crises': '⚠️',
  'Regulamentações Aéreas': '📜',
  'Manutenção de Infraestrutura': '🔨',
  'Inspeções Técnicas': '🔍',
  'Padrão de Qualidade': '✅',
  'Monitoramento de Equipamentos': '📡',
  'Planejamento de Manutenção': '📋',
  'Banco de Dados Técnico': '💾',
  'Segurança Estrutural': '🏗️',
  'PGI Rede VOA': '🎯',
  'Documentação Técnica': '📚',
  'Treinamento de Pessoal': '🎓',
  'Auditorias e Conformidade': '✔️',
  'Inovação Tecnológica': '💡',
};

const NIVEL_LABEL: Record<string, string> = {
  administrador: 'Administrador',
  operador: 'Operador',
  visualizador: 'Visualizador',
};

export function Header({ activeTab, activeMenuItem }: HeaderProps) {
  const { perfil, nivelAcesso, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [time, setTime] = useState<string>('00:00:00');
  const [date, setDate] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });

      setTime(timeStr);
      setDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeTabIcon = activeTab === 'operacao' ? '⚙️' : '🔧';
  const activeMenuIcon = MENU_ICONS[activeMenuItem] || '📌';
  const subtitle = `${activeTabIcon} ${activeTab.toUpperCase()} - ${activeMenuIcon} ${activeMenuItem}`;

  return (
    <header
      style={{
        height: isMobile ? 56 : 70,
        backgroundColor: '#0f0f1e',
        borderBottom: '2px solid #06b6d4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 20px',
        position: 'relative',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* LEFT SECTION - Check DIO Logo (já traz o nome/texto embutido na imagem) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <img
          src="/Logo-checkdio-3d.png"
          alt="Check DIO - Rede VOA - Departamento de Infraestrutura e Operações"
          style={{
            height: isMobile ? 38 : 66,
            width: 'auto',
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />

        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#cbd5e1',
              }}
            >
              SISTEMA DE GESTÃO DEPTO INFRAESTRUTURA E OPERAÇÕES (DIO)
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SECTION - Online Status + Clock & Date */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 8 : 16,
          flexShrink: 0,
        }}
      >
        {/* Usuário logado + nível de acesso */}
        {!isMobile && perfil && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>{perfil.nome}</span>
            <span style={{ fontSize: 10, color: '#64748b' }}>
              {nivelAcesso ? NIVEL_LABEL[nivelAcesso] : ''}
            </span>
          </div>
        )}

        <button
          onClick={() => signOut()}
          title="Sair"
          style={{
            padding: isMobile ? '5px 8px' : '6px 10px',
            borderRadius: 6,
            border: '1px solid #2d3e50',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontSize: isMobile ? 10 : 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sair
        </button>

        {/* Status de conexão com a internet - estático (verde=online, vermelho=offline) */}
        {!isMobile && (
          <div
            title={isOnline ? 'Online' : 'Offline'}
            style={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              backgroundColor: isOnline ? '#22c55e' : '#ef4444',
              border: isOnline ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
            }}
          />
        )}

        {/* Clock & Date Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <div
            style={{
              fontSize: isMobile ? 15 : 26,
              fontWeight: 700,
              color: '#06b6d4',
              fontFamily: 'monospace',
              letterSpacing: '1px',
            }}
          >
            {time}
          </div>

          {!isMobile && (
            <div
              style={{
                fontSize: 11,
                color: '#64748b',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {date}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
