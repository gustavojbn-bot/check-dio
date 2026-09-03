import type { Campo } from '@/hooks/useOcorrenciaMatriz';

interface Params {
  horaOcorrencia: string; // ISO ou datetime-local string
  cidadeAeroporto?: string;
  icaoAeroporto?: string;
  classificacao?: string;
  subclassificacao?: string;
  severidade?: string;
  titulo?: string;
  local?: string;
  descricao?: string;
  auxiliarNome?: string;
  dados: Record<string, unknown>;
  campos: Campo[];
}

function hhmm(v: string) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatValor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toLocaleString('pt-BR');
  }
  return String(v);
}

/** Formata uma ocorrência como mensagem de texto pronta para colar no WhatsApp. */
export function montarMensagemWhatsapp(p: Params): string {
  const hora = hhmm(p.horaOcorrencia);
  const cidade = p.cidadeAeroporto?.trim();
  const icao = p.icaoAeroporto?.trim();
  const localAero = cidade && icao ? `${cidade}/${icao}` : cidade || icao || '—';
  const tipo = [p.classificacao, p.subclassificacao].filter(Boolean).join(' - ');

  const linhas: string[] = [];

  const cabecalho = `${hora ? hora + ' - ' : ''}${localAero}${tipo ? ` (${tipo})` : ''}`;
  linhas.push(cabecalho);

  if (p.descricao?.trim()) {
    linhas.push(p.descricao.trim());
  } else if (p.titulo?.trim()) {
    linhas.push(p.titulo.trim());
  }

  const detalhes: string[] = [];
  if (p.local?.trim()) detalhes.push(`Local: ${p.local.trim()}`);
  if (p.severidade) detalhes.push(`Severidade: ${p.severidade}`);
  if (p.auxiliarNome) detalhes.push(`Auxiliar: ${p.auxiliarNome}`);

  const dinamicos = p.campos
    .map((c) => {
      const val = formatValor(p.dados[c.key]);
      return val ? `${c.label}: ${val}` : null;
    })
    .filter((s): s is string => !!s);

  const extras = [...detalhes, ...dinamicos];
  if (extras.length) {
    linhas.push('');
    linhas.push(...extras.map((e) => `- ${e}`));
  }

  return linhas.join('\n').trim();
}
