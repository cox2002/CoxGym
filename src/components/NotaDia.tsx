interface Props {
  texto: string;
  etiqueta?: string;
}

/** Aviso destacado arriba de la sesión (fútbol, descanso, recordatorios). */
export default function NotaDia({ texto, etiqueta = "Nota del día" }: Props) {
  return (
    <div className="mx-4 rounded-2xl border border-aviso/30 bg-aviso-tenue px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-aviso">
        {etiqueta}
      </p>
      <p className="mt-1 text-base leading-snug text-texto">{texto}</p>
    </div>
  );
}
