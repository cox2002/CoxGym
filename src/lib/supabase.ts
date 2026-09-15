"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type ClienteSupabase = SupabaseClient<Database>;

const URL_PROYECTO = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE_PUBLICABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Faltan las variables de entorno: la app funciona, pero sin nube. */
export const SUPABASE_CONFIGURADO = Boolean(URL_PROYECTO && CLAVE_PUBLICABLE);

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
