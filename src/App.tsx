import { useState } from 'react';
import { Header } from '@/components/Header';
import { Menu } from '@/components/Menu';
import { Login } from '@/components/Login';
import { TrocarSenhaInicial } from '@/components/TrocarSenhaInicial';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSVG from './DashboardSVG';

export default function App() {
  const { isLoading, isAuthenticated, perfil } = useAuth();

  // Menu state - centralized in App for Header integration
  const [activeTab, setActiveTab] = useState<'operacao' | 'engenharia'>('operacao');
  const [activeMenuItem, setActiveMenuItem] = useState('Painel');

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0f1e',
          color: '#94a3b8',
          fontSize: 13,
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (perfil?.senha_provisoria) {
    return <TrocarSenhaInicial />;
  }

  // Handle menu selection to update header
  const handleMenuSelect = (tab: 'operacao' | 'engenharia', item: string) => {
    setActiveTab(tab);
    setActiveMenuItem(item);
  };

  // Handle menu toggle
  const handleMenuToggle = (isOpen: boolean) => {
    // State managed in Menu component
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f0f1e',
        overflow: 'hidden',
      }}
    >
      {/* HEADER */}
      <Header activeTab={activeTab} activeMenuItem={activeMenuItem} />

      {/* MAIN CONTENT - MENU + DASHBOARD */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          width: '100%',
          gap: '0',
        }}
      >
        {/* MENU SIDEBAR - Toggle width 280px / 60px (controlado internamente pelo Menu) */}
        <Menu onMenuSelect={handleMenuSelect} onMenuToggle={handleMenuToggle} />

        {/* DASHBOARD CONTENT - Flex grow to fill remaining space */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',
          }}
        >
          <DashboardSVG activeTab={activeTab} activeMenuItem={activeMenuItem} />
        </div>
      </div>
    </div>
  );
}
