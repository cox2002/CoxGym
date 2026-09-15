/**
 * Fechas como texto "YYYY-MM-DD" (la clave de sesiones, pesos y medidas).
 * Se opera en UTC sobre la fecha pura para no arrastrar horas ni zonas:
 * la fecha de Lima ya se resolvió antes con getFechaISOHoy().
 */

const MS_POR_DIA = 86_400_000;

function aFecha(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function sumarDias(iso: string, dias: number): string {
  const fecha = aFecha(iso);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

/** Días de `desde` a `hasta` (positivo si `hasta` es posterior). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / MS_POR_DIA);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function inicioSemana(iso: string): string {
  const diaSemana = aFecha(iso).getUTCDay(); // 0 = domingo
  return sumarDias(iso, -((diaSemana + 6) % 7));
}

/** "8 set." */
export function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(aFecha(iso));
}

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas", "hace 4 meses". */
export function haceCuanto(iso: string, hoy: string): string {
  const dias = diasEntre(iso, hoy);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 14) return `hace ${dias} días`;
  if (dias < 60) return `hace ${Math.floor(dias / 7)} semanas`;
  return `hace ${Math.floor(dias / 30)} meses`;
}

/** Segundos como "m:ss" (o "h:mm:ss" si pasa de una hora). */
export function reloj(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
