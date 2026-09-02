export type CategoriaMetar = "VFR" | "MVFR" | "IFR" | "LIFR" | "sem_dado";

export const COR_METAR: Record<CategoriaMetar, string> = {
  VFR: "hsl(160 90% 50%)",
  MVFR: "hsl(45 90% 50%)",
  IFR: "hsl(25 90% 50%)",
  LIFR: "hsl(0 90% 50%)",
  sem_dado: "hsl(210 20% 50%)",
};

export const LABEL_METAR: Record<CategoriaMetar, string> = {
  VFR: "Bom",
  MVFR: "Marginal",
  IFR: "Reduzido",
  LIFR: "Mínima",
  sem_dado: "Sem dados",
};
