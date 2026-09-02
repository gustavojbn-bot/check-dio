/**
 * MapaSPSVG - FIXADO
 * - Moved useMetarRotaer para nível superior
 * - Removed 48 simultaneous API calls (16 aeroportos × 3 hooks)
 * - Now only 16 calls (1 per aeroporto)
 * - Components receive color as prop, NO hooks inside
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useMetarRotaer, getMetarColor } from "@/hooks/useMetarRotaer";
import { LegendaMetar } from "./LegendaMetar";

interface Aeroporto {
  id: string;
  icao: string;
  nome: string;
  cidade: string;
  regional: string;
  latitude: number;
  longitude: number;
  concessao?: string;
  voa?: string;
  status?: string;
}

const MARCADORES_PRECISOS = {
  SBAE: { x: 787, y: 366 },
  SBAQ: { x: 918, y: 316 },
  SBBP: { x: 1199, y: 432 },
  SBGW: { x: 1397, y: 394 },
  SBJD: { x: 1142, y: 459 },
  SBML: { x: 652, y: 382 },
  SBRP: { x: 951, y: 234 },
  SDAM: { x: 1106, y: 426 },
  SDCO: { x: 1066, y: 501 },
  SDIM: { x: 1197, y: 570 },
  SDNO: { x: 875, y: 423 },
  SDRR: { x: 825, y: 474 },
  SDSC: { x: 953, y: 321 },
  SDUB: { x: 1438, y: 468 },
  SIMK: { x: 996, y: 167 },
  SSRG: { x: 1042, y: 624 },
} as const;

const COLORS = {
  "VOA-SP": "#22c55e",
  "VOA-SE": "#3b82f6",
};

interface MapaSPSVGProps {
  aeroportos: any[];
  onSelectAeroporto?: (aeroporto: any | null) => void;
  isLoading?: boolean;
}

const IMAGE_WIDTH = 1798;
const IMAGE_HEIGHT = 875;
const MARKER_RADIUS = 5;
const RING_RADIUS = 8;
const BADGE_RADIUS = 16;
const PULSE_MAX_RADIUS = 16;

export function MapaSPSVG({
  aeroportos,
  onSelectAeroporto,
  isLoading = false,
}: MapaSPSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 506 });
  const [hoveredIcao, setHoveredIcao] = useState<string | null>(null);

  // Calcular escala
  const scale = Math.min(
    containerSize.width / IMAGE_WIDTH,
    containerSize.height / IMAGE_HEIGHT
  );

  const scaledWidth = IMAGE_WIDTH * scale;
  const scaledHeight = IMAGE_HEIGHT * scale;
  const offsetX = (containerSize.width - scaledWidth) / 2;
  const offsetY = (containerSize.height - scaledHeight) / 2;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMarkerClick = (aeroporto: Aeroporto) => {
    console.log('%c🔴 CLIQUE MARCADOR DETECTADO', 'color: red; font-weight: bold; font-size: 14px');
    console.log('%cAeroporto:', 'color: #22c55e; font-weight: bold', {
      id: aeroporto.id,
      icao: aeroporto.icao,
      nome: aeroporto.nome,
      cidade: aeroporto.cidade,
    });

    if (onSelectAeroporto) {
      console.log('%c✅ Chamando onSelectAeroporto com:', 'color: green; font-weight: bold', aeroporto.icao);
      onSelectAeroporto(aeroporto);
    } else {
      console.log('%c❌ ERRO: onSelectAeroporto está undefined!', 'color: orange; font-weight: bold');
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "visible",
        backgroundColor: "#0f0f1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* IMAGEM DO MAPA */}
      <div
        style={{
          position: "relative",
          width: scaledWidth,
          height: scaledHeight,
          backgroundImage: "url(/mapa-sp-3d.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderRadius: 4,
          overflow: "visible",
        }}
      >
        {/* MARCADORES */}
        {aeroportos.map((aeroporto) => {
          const pos = MARCADORES_PRECISOS[aeroporto.icao as keyof typeof MARCADORES_PRECISOS];
          if (!pos) return null;

          const fallbackCor = COLORS[(aeroporto.concessao || aeroporto.voa) as keyof typeof COLORS] || "#3b82f6";
          const isHovered = hoveredIcao === aeroporto.icao;

          const centerX = pos.x * scale;
          const centerY = pos.y * scale;

          return (
            <div
              key={aeroporto.icao}
              style={{
                position: "absolute",
                left: centerX,
                top: centerY,
                transform: "translate(-50%, -50%)",
                cursor: "pointer",
                width: BADGE_RADIUS * 2 * scale,
                height: BADGE_RADIUS * 2 * scale,
                zIndex: isHovered ? 100 : 50,
              }}
              onMouseEnter={() => setHoveredIcao(aeroporto.icao)}
              onMouseLeave={() => setHoveredIcao(null)}
              onClick={(e) => {
                e.stopPropagation();
                handleMarkerClick(aeroporto);
              }}
            >
              {/* ✅ FIXADO: Usar sub-componente que chama hook uma vez */}
              <MarkerContent
                icao={aeroporto.icao}
                scale={scale}
                isHovered={isHovered}
                fallbackCor={fallbackCor}
              />
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 60,
        }}
      >
        <LegendaMetar />
      </div>

      {!isLoading && aeroportos.length === 0 && (
        <div
          style={{
            position: "absolute",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "#fca5a5",
            padding: 40,
            borderRadius: 12,
            textAlign: "center",
            zIndex: 999,
            border: "2px solid #ef4444",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          ❌ Nenhum aeroporto para exibir
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% {
            width: ${RING_RADIUS * 2}px;
            height: ${RING_RADIUS * 2}px;
            opacity: 0.8;
          }
          50% {
            width: ${(RING_RADIUS + 4) * 2}px;
            height: ${(RING_RADIUS + 4) * 2}px;
            opacity: 0.3;
          }
          100% {
            width: ${PULSE_MAX_RADIUS * 2}px;
            height: ${PULSE_MAX_RADIUS * 2}px;
            opacity: 0;
          }
        }
        @keyframes badgePulse {
          0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.1); }
          100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * ✅ NOVO: Sub-componente que chama useMetarRotaer UMA VEZ
 * Retorna apenas a cor para os 3 sub-componentes
 */
function MarkerContent({
  icao,
  scale,
  isHovered,
  fallbackCor,
}: {
  icao: string;
  scale: number;
  isHovered: boolean;
  fallbackCor: string;
}) {
  // ✅ Hook chamado UMA VEZ aqui (não 3x como antes!)
  const { metar } = useMetarRotaer(icao);
  const status = metar?.status_metar || 'sem_dados';
  const color = getMetarColor(status) || fallbackCor;

  return (
    <>
      <BadgeRing color={color} scale={scale} />
      <MarkerRing
        color={color}
        scale={scale}
        isHovered={isHovered}
      />
      <MarkerCircle
        color={color}
        scale={scale}
        isHovered={isHovered}
      />
      <MarkerLabel
        icao={icao}
        isHovered={isHovered}
        color={color}
      />
    </>
  );
}

/**
 * ✅ FIXADO: Recebe cor como prop, SEM hook
 */
function BadgeRing({ color, scale }: { color: string; scale: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: BADGE_RADIUS * 2 * scale,
        height: BADGE_RADIUS * 2 * scale,
        border: `3px solid ${color}`,
        borderRadius: "50%",
        opacity: 0.6,
        animation: "badgePulse 3s infinite",
        transition: "all 0.3s ease",
        boxShadow: `inset 0 0 8px ${color}`,
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * ✅ FIXADO: Recebe cor como prop, SEM hook
 */
function MarkerRing({
  color,
  scale,
  isHovered,
}: {
  color: string;
  scale: number;
  isHovered: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: RING_RADIUS * 2 * scale,
        height: RING_RADIUS * 2 * scale,
        border: `2px solid ${color}`,
        borderRadius: "50%",
        opacity: isHovered ? 0.6 : 0.3,
        transition: "all 0.3s ease",
        animation: isHovered ? "none" : "pulse 2s infinite",
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * ✅ FIXADO: Recebe cor como prop, SEM hook
 */
function MarkerCircle({
  color,
  scale,
  isHovered,
}: {
  color: string;
  scale: number;
  isHovered: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: (MARKER_RADIUS * 2) * scale,
        height: (MARKER_RADIUS * 2) * scale,
        backgroundColor: color,
        borderRadius: "50%",
        border: "2px solid rgba(255, 255, 255, 0.8)",
        boxShadow: `0 0 8px ${color}`,
        transition: "all 0.2s ease",
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * ✅ FIXADO: Recebe cor como prop, SEM hook
 */
function MarkerLabel({
  icao,
  isHovered,
  color,
}: {
  icao: string;
  isHovered: boolean;
  color: string;
}) {
  if (!isHovered) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        color: color,
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 200,
        border: `1px solid ${color}`,
      }}
    >
      {icao}
    </div>
  );
}
