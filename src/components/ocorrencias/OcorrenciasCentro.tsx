import type { CSSProperties, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SEVERIDADE_OPCOES, severidadeLabel, severidadeCor } from '@/lib/severidade';
import type { OcorrenciasModule } from '@/hooks/useOcorrenciasModule';

const STATUS_OPCOES = [
  { value: 'aberto', label: 'Aberto', cor: '#ef4444' },
  { value: 'em_andamento', label: 'Em andamento', cor: '#f59e0b' },
  { value: 'resolvido', label: 'Resolvido', cor: '#22c55e' },
];

function isoData(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Painel central da tela de Ocorrências: botão de registro, filtros e
 * dashboard (KPIs + barras) calculados sobre o conjunto já filtrado. */
export function OcorrenciasCentro({ modulo }: { modulo: OcorrenciasModule }) {
  const { podeInserir } = useAuth();
  const { filtros, setFiltros, regionais, aeroportosFiltrados, classificacoes, rows, isLoading } = modulo;

  const atalho = (tipo: 'hoje' | '7d' | 'mes' | 'mes_anterior') => {
    const hoje = new Date();
    if (tipo === 'hoje') return setFiltros((f) => ({ ...f, periodoInicio: isoData(hoje), periodoFim: isoData(hoje) }));
    if (tipo === '7d') {
      const d = new Date(hoje);
      d.setDate(d.getDate() - 6);
      return setFiltros((f) => ({ ...f, periodoInicio: isoData(d), periodoFim: isoData(hoje) }));
    }
    if (tipo === 'mes') {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return setFiltros((f) => ({ ...f, periodoInicio: isoData(d), periodoFim: isoData(hoje) }));
    }
    const ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return setFiltros((f) => ({ ...f, periodoInicio: isoData(ini), periodoFim: isoData(fim) }));
  };

  // Agregados calculados sobre o conjunto já filtrado (rows)
  const total = rows.length;
  const abertas = rows.filter((o) => o.status === 'aberto').length;
  const emAndamento = rows.filter((o) => o.status === 'em_andamento').length;
  const resolvidas = rows.filter((o) => o.status === 'resolvido').length;
  const criticasAtivas = rows.filter((o) => o.severidade === 'critica' && o.status !== 'resolvido').length;

  const contarPor = (chave: (o: (typeof rows)[number]) => string) => {
    const mapa = new Map<string, number>();
    rows.forEach((o) => {
      const k = chave(o);
      mapa.set(k, (mapa.get(k) ?? 0) + 1);
    });
    return Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]);
  };

  const porClassificacao = contarPor((o) => modulo.classificacaoNome(o.classificacao_id)).slice(0, 8);
  const porSeveridade = SEVERIDADE_OPCOES.map((s) => ({
    label: s.label,
    valor: rows.filter((o) => o.severidade === s.value).length,
    cor: severidadeCor(s.value),
  }));
  const porStatus = STATUS_OPCOES.map((s) => ({
    label: s.label,
    valor: rows.filter((o) => o.status === s.value).length,
    cor: s.cor,
  }));

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto', backgroundColor: '#0f0f1e', padding: 16, gap: 16 }}>
      {/* CABEÇALHO + BOTÃO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>⚠️ Ocorrências</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {isLoading ? 'Carregando...' : `${total} registro(s) no período`}
          </div>
        </div>
        {podeInserir && (
          <button onClick={modulo.abrirNova} style={botaoPrimarioStyle}>
            + Nova ocorrência
          </button>
        )}
      </div>

      {/* FILTROS */}
      <div style={secaoStyle}>
        <div style={secaoTituloStyle}>Filtros</div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => atalho('hoje')} style={botaoAtalhoStyle}>Hoje</button>
          <button onClick={() => atalho('7d')} style={botaoAtalhoStyle}>Últimos 7 dias</button>
          <button onClick={() => atalho('mes')} style={botaoAtalhoStyle}>Mês atual</button>
          <button onClick={() => atalho('mes_anterior')} style={botaoAtalhoStyle}>Mês anterior</button>
        </div>

        <div style={gridStyle}>
          <Campo label="Início">
            <input type="date" value={filtros.periodoInicio} onChange={(e) => setFiltros((f) => ({ ...f, periodoInicio: e.target.value }))} style={inputStyle} />
          </Campo>
          <Campo label="Fim">
            <input type="date" value={filtros.periodoFim} onChange={(e) => setFiltros((f) => ({ ...f, periodoFim: e.target.value }))} style={inputStyle} />
          </Campo>
          <Campo label="Regional">
            <select value={filtros.regional} onChange={(e) => setFiltros((f) => ({ ...f, regional: e.target.value, aeroportoId: 'todos' }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="todas">Todas</option>
              {regionais.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Aeroporto">
            <select value={filtros.aeroportoId} onChange={(e) => setFiltros((f) => ({ ...f, aeroportoId: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="todos">Todos</option>
              {aeroportosFiltrados.map((a: any) => (
                <option key={a.id} value={a.id}>{a.icao} · {a.cidade}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Classificação">
            <select value={filtros.classificacaoId} onChange={(e) => setFiltros((f) => ({ ...f, classificacaoId: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="todas">Todas</option>
              {classificacoes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Status">
            <select value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="todos">Todos</option>
              {STATUS_OPCOES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Severidade">
            <select value={filtros.severidade} onChange={(e) => setFiltros((f) => ({ ...f, severidade: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="todas">Todas</option>
              {SEVERIDADE_OPCOES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Busca">
            <input type="text" placeholder="Título, local, ICAO..." value={filtros.busca} onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))} style={inputStyle} />
          </Campo>
        </div>
      </div>

      {/* DASHBOARD */}
      <div style={secaoStyle}>
        <div style={secaoTituloStyle}>Dashboard</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          <Kpi label="Total" valor={total} />
          <Kpi label="Abertas" valor={abertas} cor="#ef4444" />
          <Kpi label="Em andamento" valor={emAndamento} cor="#f59e0b" />
          <Kpi label="Resolvidas" valor={resolvidas} cor="#22c55e" />
          <Kpi label="Críticas ativas" valor={criticasAtivas} cor="#ef4444" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 6 }}>
          <BarraLista titulo="Por classificação" itens={porClassificacao.map(([label, valor]) => ({ label, valor, cor: '#06b6d4' }))} />
          <BarraLista titulo="Por severidade" itens={porSeveridade.map((s) => ({ label: s.label, valor: s.valor, cor: s.cor }))} />
          <BarraLista titulo="Por status" itens={porStatus.map((s) => ({ label: s.label, valor: s.valor, cor: s.cor }))} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, valor, cor }: { label: string; valor: number; cor?: string }) {
  return (
    <div style={{ borderRadius: 6, border: '1px solid #2d3e50', backgroundColor: '#1e293b', padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: cor ?? '#06b6d4', lineHeight: 1.3 }}>{valor}</div>
    </div>
  );
}

function BarraLista({ titulo, itens }: { titulo: string; itens: { label: string; valor: number; cor: string }[] }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div style={{ borderRadius: 6, border: '1px solid #2d3e50', backgroundColor: '#1e293b', padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>{titulo}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {itens.length === 0 && <div style={{ fontSize: 11, color: '#64748b' }}>Sem dados</div>}
        {itens.map((i) => (
          <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 90, fontSize: 10, color: '#cbd5e1', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={i.label}>
              {i.label}
            </div>
            <div style={{ flex: 1, height: 10, backgroundColor: '#0f0f1e', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${(i.valor / max) * 100}%`, height: '100%', backgroundColor: i.cor, borderRadius: 4 }} />
            </div>
            <div style={{ width: 20, fontSize: 10, color: '#e2e8f0', textAlign: 'right', flexShrink: 0 }}>{i.valor}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const botaoPrimarioStyle: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#06b6d4',
  color: '#0f0f1e',
  fontWeight: 700,
  fontSize: 12,
  cursor: 'pointer',
};

const botaoAtalhoStyle: CSSProperties = {
  padding: '5px 10px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: 'transparent',
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

const secaoStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  borderRadius: 8,
  border: '1px solid #2d3e50',
  backgroundColor: 'rgba(30, 41, 59, 0.4)',
  padding: 14,
};

const secaoTituloStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#e2e8f0',
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 10,
};

const inputStyle: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: '#0f0f1e',
  color: '#e2e8f0',
  fontSize: 12,
  outline: 'none',
};
