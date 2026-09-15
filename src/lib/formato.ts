/** Números como en el diseño: coma decimal ("82,5 kg", "18,4 t"). */
export function numero(valor: number, decimales = 1): string {
  return new Intl.NumberFormat("es", {
    maximumFractionDigits: decimales,
  }).format(valor);
}

/** Acepta "82,5" o "82.5"; devuelve null si el texto no es un número. */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return null;
  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : null;
}

/** "90 s", "2 min": minutos solo cuando son exactos. */
export function duracionDescanso(segundos: number): string {
  return segundos >= 60 && segundos % 60 === 0
    ? `${segundos / 60} min`
    : `${segundos} s`;
}

/** Kilos a toneladas con una cifra: 18432 → "18,4 t". */
export function toneladas(kg: number): string {
  return `${numero(kg / 1000, 1)} t`;
}
