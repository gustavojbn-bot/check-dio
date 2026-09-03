export type Severidade = "baixa" | "media" | "alta" | "critica" | "info" | "atencao";

export const COR_SEVERIDADE: Record<Severidade, string> = {
  critica: "#f87171",
  alta: "#fb923c",
  media: "#fbbf24",
  atencao: "#fbbf24",
  baixa: "#6ee7b7",
  info: "#38bdf8",
};

export const LABEL_SEVERIDADE: Record<Severidade, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  atencao: "Média",
  baixa: "Baixa",
  info: "Baixa",
};

export const SEVERIDADE_OPCOES: Array<{ value: "baixa" | "media" | "alta" | "critica"; label: string }> = [
  { value: "baixa", label: "Baixo" },
  { value: "media", label: "Médio" },
  { value: "alta", label: "Alto" },
  { value: "critica", label: "Crítico" },
];

export function severidadeLabel(s: Severidade | string | null | undefined): string {
  return LABEL_SEVERIDADE[(s as Severidade) ?? "media"] ?? String(s ?? "—");
}

export function severidadeCor(s: Severidade | string | null | undefined): string {
  return COR_SEVERIDADE[(s as Severidade) ?? "media"] ?? "#94a3b8";
}
