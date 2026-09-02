import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rótulo curto usado na mensagem de fallback (ex.: "Painel do aeroporto") */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` - ${this.props.label}` : ''}] 💥`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '24px',
            textAlign: 'center',
            color: '#fca5a5',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontSize: '24px' }}>⚠️</div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              {this.props.label ? `Erro em ${this.props.label}` : 'Algo deu errado'}
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{this.state.error.message}</div>
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#fca5a5',
              backgroundColor: 'transparent',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
