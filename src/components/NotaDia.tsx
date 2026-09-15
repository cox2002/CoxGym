interface Props {
  texto: string;
}

/** Aviso del día (fútbol, recordatorios), sobrio como en el diseño. */
export default function NotaDia({ texto }: Props) {
  return (
    <p className="rounded-2xl border border-borde-alto bg-[#101216] px-3.5 py-3 text-[13px] leading-normal text-[#96a3b1] text-pretty">
      {texto}
    </p>
  );
}
