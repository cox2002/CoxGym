"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type ClienteSupabase = SupabaseClient<Database>;

/** Solo una URL http(s) válida; cualquier otra cosa cuenta como no configurada. */
function urlValida(valor: string | undefined): string | undefined {
  const limpio = valor?.trim();
  return limpio && /^https?:\/\/[^\s[\]()]+$/.test(limpio) ? limpio : undefined;
}

const URL_PROYECTO = urlValida(process.env.NEXT_PUBLIC_SUPABASE_URL);
const CLAVE_PUBLICABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

/**
 * Faltan (o están mal escritas) las variables de entorno: la app funciona,
 * pero solo guarda en el teléfono. Nunca debe romper la app entera.
 */
export const SUPABASE_CONFIGURADO = Boolean(URL_PROYECTO && CLAVE_PUBLICABLE);

if (!SUPABASE_CONFIGURADO && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn(
    "[CoxGym] NEXT_PUBLIC_SUPABASE_URL no es una URL válida: debe ser solo https://xxxx.supabase.co",
  );
}

let cliente: ClienteSupabase | null = null;

/**
 * Cliente único de Supabase. Solo existe en el navegador: al compilar el sitio
 * estático no hay sesión que leer. La sesión se guarda en localStorage.
 */
export function getSupabase(): ClienteSupabase | null {
  if (typeof window === "undefined" || !URL_PROYECTO || !CLAVE_PUBLICABLE) {
    return null;
  }
  cliente ??= createClient<Database>(URL_PROYECTO, CLAVE_PUBLICABLE, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return cliente;
}
