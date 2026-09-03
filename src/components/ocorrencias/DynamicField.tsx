import type { CSSProperties } from 'react';
import type { Campo } from '@/hooks/useOcorrenciaMatriz';

interface Props {
  campo: Campo;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function DynamicField({ campo, value, onChange }: Props) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
        {campo.label}
        {campo.obrigatorio && <span style={{ color: '#ef4444' }}> *</span>}
      </span>

      {campo.tipo === 'text' && (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {campo.tipo === 'textarea' && (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      )}

      {campo.tipo === 'number' && (
        <input
          type="number"
          value={(value as number | string) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          style={inputStyle}
        />
      )}

      {campo.tipo === 'datetime' && (
        <input
          type="datetime-local"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}

      {campo.tipo === 'boolean' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>{value === true ? 'Sim' : 'Não'}</span>
        </div>
      )}

      {campo.tipo === 'select' && (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">Selecionar...</option>
          {campo.opcoes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {campo.tipo === 'multiselect' && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            borderRadius: 6,
            border: '1px solid #2d3e50',
            backgroundColor: '#0f0f1e',
            padding: '8px 10px',
          }}
        >
          {campo.opcoes.map((o) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(o);
            return (
              <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#cbd5e1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const set = new Set(arr);
                    if (e.target.checked) set.add(o);
                    else set.delete(o);
                    onChange(Array.from(set));
                  }}
                  style={{ width: 14, height: 14, cursor: 'pointer' }}
                />
                {o}
              </label>
            );
          })}
        </div>
      )}

      {campo.ajuda && <span style={{ fontSize: 10, color: '#64748b' }}>{campo.ajuda}</span>}
    </label>
  );
}

export function validateCampos(campos: Campo[], dados: Record<string, unknown>): string | null {
  for (const c of campos) {
    if (!c.obrigatorio) continue;
    const v = dados[c.key];
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) return `Preencha "${c.label}"`;
  }
  return null;
}

const inputStyle: CSSProperties = {
  padding: '9px 10px',
  borderRadius: 6,
  border: '1px solid #2d3e50',
  backgroundColor: '#0f0f1e',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
};
