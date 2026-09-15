import type { ReactNode } from "react";

interface Props {
  titulo: string;
  /** A la derecha del título: un dato de contexto o un botón. */
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Tarjeta({ titulo, extra, children, className = "" }: Props) {
  return (
    <section className={`rounded-[20px] border border-borde bg-superficie p-4 ${className}`}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <h2 className="text-[10.5px] font-bold tracking-[1.4px] text-apagado uppercase">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

/** Texto de estado vacío dentro de una tarjeta. */
export function Vacio({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[13px] leading-relaxed text-tenue">{children}</p>;
}
