"use client";

interface Props {
  etiqueta: string;
  unidad: string;
  valor: string;
  onCambiar: (valor: string) => void;
  placeholder?: string;
}

/** Campo numérico con unidad a la derecha. 16px de letra: iOS no hace zoom al tocarlo. */
export default function CampoNumero({ etiqueta, unidad, valor, onCambiar, placeholder }: Props) {
  return (
    <label className="block">
      <span className="text-[11.5px] font-semibold text-tenue">{etiqueta}</span>
      <span className="mt-1 flex items-center rounded-xl border border-borde-alto bg-campo pr-3 focus-within:ring-2 focus-within:ring-acento/60">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onCambiar(e.target.value.replace(/[^\d.,]/g, "").slice(0, 6))}
          className="w-full min-w-0 bg-transparent px-3 py-2.5 text-base font-bold tabular-nums outline-none placeholder:font-semibold placeholder:text-[#64707d]"
        />
        <span className="text-[13px] font-semibold text-tenue">{unidad}</span>
      </span>
    </label>
  );
}
