export type Severidade = "critica" | "alta" | "media" | "baixa";

export const COR_SEVERIDADE: Record<Severidade, string> = {
  critica: "#f87171",
  alta: "#fb923c",
  media: "#fbbf24",
  baixa: "#6ee7b7",
};

export const LABEL_SEVERIDADE: Record<Severidade, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};
