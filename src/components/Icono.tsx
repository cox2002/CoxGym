const TRAZOS = {
  atras: "m15 6-6 6 6 6",
  adelante: "m9 6 6 6-6 6",
  check: "M20 6 9 17l-5-5",
  mas: "M12 5v14M5 12h14",
  menos: "M5 12h14",
  nube: "M7 18a4.5 4.5 0 0 1-.9-8.9 6 6 0 0 1 11.6 1.4A3.8 3.8 0 0 1 17 18H7Z",
  usuario: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  camara: "M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  basura: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  trofeo: "M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

interface Props {
  nombre: NombreIcono;
  className?: string;
  grosor?: number;
}

/** Íconos de trazo del diseño (24×24). Decorativos: el texto de al lado da el significado. */
export default function Icono({ nombre, className = "size-4", grosor = 2.2 }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
