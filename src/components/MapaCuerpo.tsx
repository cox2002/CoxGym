import { NOMBRE_MUSCULO } from "@/lib/musculos";
import type { Musculo } from "@/types/rutina";

interface Props {
  /** Músculos resaltados con el acento. */
  activos: Musculo[];
  /** Músculos que trabajan menos: tono intermedio. */
  secundarios?: Musculo[];
  className?: string;
}

const COLOR_ACTIVO = "#38bdf8";
const COLOR_SECUNDARIO = "#1d4a63";
const COLOR_BASE = "#1b222b";
const COLOR_CABEZA = "#151a20";

/** Silueta de frente y de espalda con los músculos trabajados (del diseño en Claude Design). */
export default function MapaCuerpo({ activos, secundarios = [], className }: Props) {
  const color = (musculo: Musculo) =>
    activos.includes(musculo)
      ? COLOR_ACTIVO
      : secundarios.includes(musculo)
        ? COLOR_SECUNDARIO
        : COLOR_BASE;

  const descripcion = activos.length
    ? `Músculos trabajados: ${activos.map((m) => NOMBRE_MUSCULO[m]).join(", ")}`
    : "Sin músculos trabajados";

  return (
    <svg viewBox="0 0 210 220" role="img" aria-label={descripcion} className={className}>
      {/* Frente */}
      <g>
        <rect x="44" y="20" width="12" height="20" rx="5" fill={COLOR_CABEZA} />
        <circle cx="50" cy="15" r="11" fill={COLOR_CABEZA} />
        <rect x="34" y="36" width="32" height="50" rx="11" fill={color("core")} />
        <rect x="34" y="36" width="32" height="24" rx="10" fill={color("pecho")} />
        <ellipse cx="29" cy="45" rx="11" ry="9" fill={color("hombro")} />
        <ellipse cx="71" cy="45" rx="11" ry="9" fill={color("hombro")} />
        <ellipse cx="24" cy="60" rx="7.5" ry="15" fill={color("biceps")} />
        <ellipse cx="76" cy="60" rx="7.5" ry="15" fill={color("biceps")} />
        <ellipse cx="20" cy="84" rx="6.5" ry="15" fill={color("antebrazo")} />
        <ellipse cx="80" cy="84" rx="6.5" ry="15" fill={color("antebrazo")} />
        <rect x="34" y="80" width="32" height="16" rx="7" fill={COLOR_CABEZA} />
        <ellipse cx="41" cy="118" rx="11" ry="30" fill={color("cuadriceps")} />
        <ellipse cx="59" cy="118" rx="11" ry="30" fill={color("cuadriceps")} />
        <ellipse cx="41" cy="166" rx="8" ry="24" fill={color("gemelo")} />
        <ellipse cx="59" cy="166" rx="8" ry="24" fill={color("gemelo")} />
        <ellipse cx="41" cy="190" rx="6" ry="6" fill={COLOR_CABEZA} />
        <ellipse cx="59" cy="190" rx="6" ry="6" fill={COLOR_CABEZA} />
      </g>
      {/* Espalda */}
      <g>
        <rect x="154" y="20" width="12" height="20" rx="5" fill={COLOR_CABEZA} />
        <circle cx="160" cy="15" r="11" fill={COLOR_CABEZA} />
        <rect x="144" y="36" width="32" height="52" rx="11" fill={color("espalda")} />
        <rect x="146" y="30" width="28" height="16" rx="7" fill={color("trapecio")} />
        <ellipse cx="139" cy="45" rx="11" ry="9" fill={color("hombroPost")} />
        <ellipse cx="181" cy="45" rx="11" ry="9" fill={color("hombroPost")} />
        <ellipse cx="134" cy="60" rx="7.5" ry="15" fill={color("triceps")} />
        <ellipse cx="186" cy="60" rx="7.5" ry="15" fill={color("triceps")} />
        <ellipse cx="130" cy="84" rx="6.5" ry="15" fill={color("antebrazo")} />
        <ellipse cx="190" cy="84" rx="6.5" ry="15" fill={color("antebrazo")} />
        <rect x="143" y="82" width="34" height="22" rx="10" fill={color("gluteo")} />
        <ellipse cx="151" cy="126" rx="11" ry="27" fill={color("isquios")} />
        <ellipse cx="169" cy="126" rx="11" ry="27" fill={color("isquios")} />
        <ellipse cx="151" cy="166" rx="8" ry="24" fill={color("gemelo")} />
        <ellipse cx="169" cy="166" rx="8" ry="24" fill={color("gemelo")} />
        <ellipse cx="151" cy="190" rx="6" ry="6" fill={COLOR_CABEZA} />
        <ellipse cx="169" cy="190" rx="6" ry="6" fill={COLOR_CABEZA} />
      </g>
    </svg>
  );
}
