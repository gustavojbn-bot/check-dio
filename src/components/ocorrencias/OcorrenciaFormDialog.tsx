import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAeroportosFromBD } from '@/hooks/useAeroportosFromBD';
import {
  useClassificacoes,
  useSubclassificacoes,
  useCamposMatriz,
  useDocumentosMatriz,
  dbAny,
} from '@/hooks/useOcorrenciaMatriz';
import { useAuxiliares } from '@/hooks/useAuxiliares';
import { montarMensagemWhatsapp } from '@/lib/whatsapp-ocorrencia';
import { DynamicField, validateCampos } from './DynamicField';
import { SEVERIDADE_OPCOES, type Severidade } from '@/lib/severidade';

type Status = 'aberto' | 'em_andamento' | 'resolvido';

interface DocStatus {
  doc_id: string;
  nome: string;
  responsavel: string;
  feito: boolean;
  feito_em: string | null;
}

interface Props {
  ocorrenciaId?: string | null;
  onClose: () => void;
  onSalvo?: () => void;
}

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return nowLocal();
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** Modal de registro/edição de ocorrência, com classificação/subclassificação
 * dinâmica (campos e documentos exigidos vindos da matriz configurável). */
export function OcorrenciaFormDialog({ ocorrenciaId = null, onClose, onSalvo }: Props) {
  const qc = useQueryClient();
  const { user, podeExcluir } = useAuth();
  const isEdit = !!ocorrenciaId;

  const [classificacaoId, setClassificacaoId] = useState<string | null>(null);
  const [subclassificacaoId, setSubclassificacaoId] = useState<string | null>(null);
  const [aeroportoId, setAeroportoId] = useState<string | null>(null);
  const [auxiliarId, setAuxiliarId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [local, setLocal] = useState('');
  const [severidade, setSeveridade] = useState<Severidade>('media');
  const [status, setStatus] = useState<Status>('aberto');
  const [horaOcorrencia, setHoraOcorrencia] = useState(nowLocal());
  const [descricao, setDescricao] = useState('');
  const [dados, setDados] = useState<Record<string, unknown>>({});
  const [docsFeitos, setDocsFeitos] = useState<Record<string, boolean>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const classificacoes = useClassificacoes();
  const subclassificacoes = useSubclassificacoes(classificacaoId);
  const campos = useCamposMatriz(classificacaoId, subclassificacaoId);
  const documentos = useDocumentosMatriz(classificacaoId, subclassificacaoId);
  const auxiliares = useAuxiliares();
  const { data: aeroportos } = useAeroportosFromBD();

  const existente = useQuery({
    queryKey: ['ocorrencia', ocorrenciaId],
    enabled: !!ocorrenciaId,
    queryFn: async () => {
      const { data, error } = await dbAny.from('ocorrencias').select('*').eq('id', ocorrenciaId).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!existente.data || !isEdit) return;
    const o = existente.data;
    setClassificacaoId(o.classificacao_id ?? null);
    setSubclassificacaoId(o.subclassificacao_id ?? null);
    setAeroportoId(o.aeroporto_id ?? null);
    setAuxiliarId(o.auxiliar_id ?? null);
    setTitulo(o.titulo ?? '');
    setLocal(o.local ?? '');
    setSeveridade((o.severidade as Severidade) ?? 'media');
    setStatus((o.status as Status) ?? 'aberto');
    setHoraOcorrencia(toLocalInput(o.hora_ocorrencia));
    setDescricao(o.descricao ?? '');
    setDados((o.dados as Record<string, unknown>) ?? {});
    const docs: DocStatus[] = o.documentos_status ?? [];
    const map: Record<string, boolean> = {};
    docs.forEach((d) => (map[d.doc_id] = !!d.feito));
    setDocsFeitos(map);
  }, [existente.data, isEdit]);

  const classifSelecionada = useMemo(
    () => classificacoes.data?.find((c) => c.id === classificacaoId) ?? null,
    [classificacoes.data, classificacaoId],
  );
  const subSelecionada = useMemo(
    () => subclassificacoes.data?.find((s) => s.id === subclassificacaoId) ?? null,
    [subclassificacoes.data, subclassificacaoId],
  );

  const salvar = useMutation({
    mutationFn: async () => {
      if (!classificacaoId) throw new Error('Selecione a classificação');
      if (!aeroportoId) throw new Error('Selecione o aeroporto');
      if (!titulo.trim()) throw new Error('Informe um título');
      const errCampos = validateCampos(campos.data ?? [], dados);
      if (errCampos) throw new Error(errCampos);

      const docsStatus: DocStatus[] = (documentos.data ?? []).map((d) => ({
        doc_id: d.id,
        nome: d.nome,
        responsavel: d.responsavel,
        feito: !!docsFeitos[d.id],
        feito_em: docsFeitos[d.id] ? new Date().toISOString() : null,
      }));

      const payload: Record<string, unknown> = {
        classificacao_id: classificacaoId,
        subclassificacao_id: subclassificacaoId,
        aeroporto_id: aeroportoId,
        auxiliar_id: auxiliarId,
        titulo: titulo.trim(),
        local: local.trim(),
        severidade,
        tipo: classifSelecionada?.nome ?? 'Ocorrência',
        descricao: descricao.trim(),
        hora_ocorrencia: new Date(horaOcorrencia).toISOString(),
        dados,
        documentos_status: docsStatus,
        status,
        atualizado_em: new Date().toISOString(),
      };

      if (isEdit) {
        if (status === 'resolvido' && existente.data?.status !== 'resolvido') {
          payload.resolvido_em = new Date().toISOString();
        } else if (status !== 'resolvido') {
          payload.resolvido_em = null;
        }
        const { error } = await dbAny.from('ocorrencias').update(payload).eq('id', ocorrenciaId);
        if (error) throw error;
      } else {
        payload.criado_por = user?.id ?? null;
        if (status === 'resolvido') payload.resolvido_em = new Date().toISOString();
        const { error } = await dbAny.from('ocorrencias').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ocorrencias'] });
      if (ocorrenciaId) qc.invalidateQueries({ queryKey: ['ocorrencia', ocorrenciaId] });
      onSalvo?.();
      onClose();
    },
    onError: (e: Error) => setErro(e.message),
  });

  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [justificativa, setJustificativa] = useState('');

  const excluir = useMutation({
    mutationFn: async () => {
      if (!ocorrenciaId) throw new Error('Ocorrência inválida');
      const just = justificativa.trim();
      if (just.length < 10) throw new Error('Descreva a justificativa (mínimo 10 caracteres)');
      if (!user?.id) throw new Error('Sessão expirada');

      const { error: logErr } = await dbAny.from('ocorrencias_exclusoes').insert({
        ocorrencia_id: ocorrenciaId,
        justificativa: just,
        excluido_por: user.id,
        snapshot: existente.data ?? {},
      });
      if (logErr) throw logErr;

      const { error } = await dbAny.from('ocorrencias').delete().eq('id', ocorrenciaId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ocorrencias'] });
      onSalvo?.();
      onClose();
    },
    onError: (e: Error) => setErro(e.message),
  });

  const copiarWhatsapp = async () => {
    const aero = aeroportos?.find((a) => a.id === aeroportoId);
    const aux = auxiliares.data?.find((a) => a.id === auxiliarId);
    const msg = montarMensagemWhatsapp({
      horaOcorrencia,
      cidadeAeroporto: aero?.cidade,
      icaoAeroporto: aero?.icao,
      classificacao: classifSelecionada?.nome,
      subclassificacao: subSelecionada?.nome,
      severidade: SEVERIDADE_OPCOES.find((s) => s.value === severidade)?.label,
      titulo,
      local,
      descricao,
      auxiliarNome: aux?.nome,
      dados,
      campos: campos.data ?? [],
    });
    try {
      await navigator.clipboard.writeText(msg);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro('Não foi possível copiar. Selecione e copie manualmente.');
    }
  };

  const loadingEdit = isEdit && existente.isLoading;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
            {isEdit ? 'Editar ocorrência' : 'Registrar ocorrência'}
          </div>
          <button onClick={onClose} style={closeButtonStyle} title="Fechar">
            ✕
          </button>
        </div>

        {loadingEdit ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>⏳ Carregando...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={gridStyle}>
              <Campo label="Classificação *">
                <select
                  value={classificacaoId ?? ''}
                  onChange={(e) => {
                    setClassificacaoId(e.target.value || null);
                    setSubclassificacaoId(null);
                    setDados({});
                    setDocsFeitos({});
                  }}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Selecione...</option>
                  {classificacoes.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                {classifSelecionada?.descricao && <Ajuda>{classifSelecionada.descricao}</Ajuda>}
              </Campo>

              <Campo label="Subclassificação">
                <select
                  value={subclassificacaoId ?? ''}
                  onChange={(e) => {
                    setSubclassificacaoId(e.target.value || null);
                    setDados({});
                  }}
                  disabled={!classificacaoId || (subclassificacoes.data?.length ?? 0) === 0}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">
                    {(subclassificacoes.data?.length ?? 0) === 0 ? '— não aplicável —' : 'Selecione...'}
                  </option>
                  {subclassificacoes.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
                {subSelecionada?.exemplos && <Ajuda><strong>Exemplos:</strong> {subSelecionada.exemplos}</Ajuda>}
              </Campo>
            </div>

            <div style={gridStyle}>
              <Campo label="Aeroporto *">
                <select value={aeroportoId ?? ''} onChange={(e) => setAeroportoId(e.target.value || null)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecione...</option>
                  {aeroportos?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icao} · {a.cidade}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo label="Auxiliar responsável">
                <select value={auxiliarId ?? ''} onChange={(e) => setAuxiliarId(e.target.value || null)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecione...</option>
                  {auxiliares.data?.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo label="Data/hora da ocorrência">
                <input type="datetime-local" value={horaOcorrencia} onChange={(e) => setHoraOcorrencia(e.target.value)} style={inputStyle} />
              </Campo>

              <Campo label="Severidade">
                <select value={severidade} onChange={(e) => setSeveridade(e.target.value as Severidade)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {SEVERIDADE_OPCOES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="aberto">Aberto</option>
                <option value="em_andamento">Em andamento</option>
                <option value="resolvido">Resolvido</option>
              </select>
            </Campo>

            <Campo label="Título *">
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Resumo curto" maxLength={200} style={inputStyle} />
            </Campo>

            <Campo label="Local">
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex.: pátio, cabeceira 15, área pública..."
                style={inputStyle}
              />
            </Campo>

            <Campo label="Descrição">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={6}
                placeholder="Relato livre do fato"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 120 }}
              />
            </Campo>

            {classificacaoId && (campos.data?.length ?? 0) > 0 && (
              <div style={secaoStyle}>
                <div style={secaoTituloStyle}>Detalhes específicos</div>
                <div style={gridStyle}>
                  {campos.data?.map((c) => (
                    <DynamicField key={c.id} campo={c} value={dados[c.key]} onChange={(v) => setDados((d) => ({ ...d, [c.key]: v }))} />
                  ))}
                </div>
              </div>
            )}

            {classificacaoId && (documentos.data?.length ?? 0) > 0 && (
              <div style={secaoStyle}>
                <div style={secaoTituloStyle}>Documentos a preencher</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {documentos.data?.map((d) => (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 6, backgroundColor: '#0f0f1e', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!docsFeitos[d.id]}
                        onChange={(e) => setDocsFeitos((s) => ({ ...s, [d.id]: e.target.checked }))}
                        style={{ width: 15, height: 15, marginTop: 2, cursor: 'pointer' }}
                      />
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{d.nome}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>
                          Responsável: {d.responsavel}
                          {d.prazo_horas ? ` · prazo ${d.prazo_horas}h` : ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {erro && <div style={avisoErroStyle}>{erro}</div>}

            {isEdit && podeExcluir && confirmarExclusao && (
              <div style={{ ...secaoStyle, border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.06)' }}>
                <div style={{ ...secaoTituloStyle, color: '#f87171' }}>Justificativa da exclusão *</div>
                <textarea
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  rows={3}
                  placeholder="Explique o motivo da exclusão (mínimo 10 caracteres)"
                  maxLength={1000}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => {
                      setConfirmarExclusao(false);
                      setJustificativa('');
                    }}
                    style={botaoSecundarioStyle}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => excluir.mutate()}
                    disabled={excluir.isPending || justificativa.trim().length < 10}
                    style={{ ...botaoPrimarioStyle, backgroundColor: '#ef4444' }}
                  >
                    {excluir.isPending ? 'Excluindo...' : 'Confirmar exclusão'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
              {isEdit && podeExcluir && !confirmarExclusao ? (
                <button onClick={() => setConfirmarExclusao(true)} style={{ ...botaoSecundarioStyle, color: '#f87171', borderColor: '#f87171' }}>
                  Excluir
                </button>
              ) : (
                <span />
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={copiarWhatsapp} disabled={!aeroportoId || !titulo.trim()} style={botaoSecundarioStyle} title="Copiar mensagem formatada para WhatsApp">
                  {copiado ? '✅ Copiado' : '💬 Copiar p/ WhatsApp'}
                </button>
                <button onClick={onClose} style={botaoSecundarioStyle}>
                  Cancelar
                </button>
                <button onClick={() => salvar.mutate()} disabled={salvar.isPending || loadingEdit} style={botaoPrimarioStyle}>
                  {salvar.isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Registrar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

function Ajuda({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: 10, color: '#64748b' }}>{children}</span>;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
};

const modalStyle: CSSProperties = {
  width: 720,
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  backgroundColor: '#1e293b',
  border: '1px solid #2d3e50',
  borderRadius: 10,
  padding: 20,
  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
};

const closeButtonStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  border: '1px solid #2d3e50',
  backgroundColor: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 12,
  flexShrink: 0,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

const inputStyle: CSSProperties = {
  padding: '9px 10px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: '#0f0f1e',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
};

const secaoStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  borderRadius: 8,
  border: '1px solid #2d3e50',
  backgroundColor: 'rgba(15, 15, 30, 0.4)',
  padding: 14,
};

const secaoTituloStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#e2e8f0',
};

const avisoErroStyle: CSSProperties = {
  padding: 12,
  borderRadius: 6,
  border: '1px solid #ef4444',
  backgroundColor: 'rgba(239, 68, 68, 0.08)',
  color: '#fca5a5',
  fontSize: 12,
};

const botaoPrimarioStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#06b6d4',
  color: '#0f0f1e',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

const botaoSecundarioStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: 'transparent',
  color: '#cbd5e1',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};
