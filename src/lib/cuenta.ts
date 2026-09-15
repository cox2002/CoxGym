"use client";

import type { User } from "@supabase/supabase-js";
import { crearEstado, useAlmacen } from "@/lib/almacen";
import { programarSincronizacion } from "@/lib/sincronizacion";
import { getSupabase } from "@/lib/supabase";

interface EstadoCuenta {
  /** true hasta que Supabase dice si hay sesión guardada. */
  cargando: boolean;
  usuario: User | null;
  /** Se entró desde el enlace de "olvidé mi contraseña": falta elegir una nueva. */
  recuperandoClave: boolean;
}

const almacenCuenta = crearEstado<EstadoCuenta>({
  cargando: true,
  usuario: null,
  recuperandoClave: false,
});

export function useCuenta(): EstadoCuenta {
  return useAlmacen(almacenCuenta);
}

export function terminarRecuperacion() {
  almacenCuenta.actualizar((estado) => ({ ...estado, recuperandoClave: false }));
}

/** Escucha la sesión de Supabase durante toda la vida de la app. */
export function escucharCuenta(): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    almacenCuenta.escribir({ cargando: false, usuario: null, recuperandoClave: false });
    return () => {};
  }

  // Emite INITIAL_SESSION al suscribirse, así que no hace falta getSession().
  const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
    almacenCuenta.actualizar((estado) => ({
      cargando: false,
      usuario: sesion?.user ?? null,
      recuperandoClave: evento === "PASSWORD_RECOVERY" || (estado.recuperandoClave && Boolean(sesion)),
    }));
    // Fuera del callback: Supabase no permite llamarse a sí mismo aquí dentro.
    if (sesion) programarSincronizacion(0);
  });

  return () => data.subscription.unsubscribe();
}

/** Traduce los errores de Supabase Auth más comunes. */
export function mensajeErrorCuenta(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Primero confirma tu correo con el enlace que te enviamos.";
    case "user_already_exists":
    case "email_exists":
      return "Ya existe una cuenta con ese correo. Entra con tu contraseña.";
    case "weak_password":
      return "La contraseña es muy débil: usa al menos 8 caracteres.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Demasiados intentos seguidos. Espera unos minutos.";
    case "email_address_invalid":
      return "Ese correo no es válido.";
    case "signup_disabled":
      return "El registro de cuentas nuevas está desactivado.";
    case "same_password":
      return "La nueva contraseña tiene que ser distinta de la anterior.";
    default:
      return error.message.includes("fetch")
        ? "Sin conexión. Inténtalo cuando tengas internet."
        : error.message;
  }
}
