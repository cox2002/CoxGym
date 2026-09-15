/**
 * Tipos de la base de datos de Supabase (proyecto "coxgym").
 * Generados desde el esquema; si cambian las tablas, se vuelven a generar.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      fotos_progreso: {
        Row: {
          creado_en: string;
          fecha: string;
          id: string;
          ruta: string;
          user_id: string;
        };
        Insert: {
          creado_en?: string;
          fecha: string;
          id?: string;
          ruta: string;
          user_id?: string;
        };
        Update: {
          creado_en?: string;
          fecha?: string;
          id?: string;
          ruta?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      medidas: {
        Row: {
          fecha: string;
          user_id: string;
          valor_cm: number;
          zona: string;
        };
        Insert: {
          fecha: string;
          user_id?: string;
          valor_cm: number;
          zona: string;
        };
        Update: {
          fecha?: string;
          user_id?: string;
          valor_cm?: number;
          zona?: string;
        };
        Relationships: [];
      };
      pesos_corporales: {
        Row: {
          fecha: string;
          peso_kg: number;
          user_id: string;
        };
        Insert: {
          fecha: string;
          peso_kg: number;
          user_id?: string;
        };
        Update: {
          fecha?: string;
          peso_kg?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      series: {
        Row: {
          completada: boolean;
          dia: string;
          ejercicio_id: string;
          fecha: string;
          orden: number;
          peso_kg: number | null;
          reps: number | null;
          rpe: number | null;
          user_id: string;
        };
        Insert: {
          completada?: boolean;
          dia: string;
          ejercicio_id: string;
          fecha: string;
          orden: number;
          peso_kg?: number | null;
          reps?: number | null;
          rpe?: number | null;
          user_id?: string;
        };
        Update: {
          completada?: boolean;
          dia?: string;
          ejercicio_id?: string;
          fecha?: string;
          orden?: number;
          peso_kg?: number | null;
          reps?: number | null;
          rpe?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "series_user_id_fecha_dia_fkey";
            columns: ["user_id", "fecha", "dia"];
            isOneToOne: false;
            referencedRelation: "sesiones";
            referencedColumns: ["user_id", "fecha", "dia"];
          },
        ];
      };
      sesiones: {
        Row: {
          dia: string;
          fecha: string;
          iniciada_en: string;
          terminada_en: string | null;
          user_id: string;
        };
        Insert: {
          dia: string;
          fecha: string;
          iniciada_en?: string;
          terminada_en?: string | null;
          user_id?: string;
        };
        Update: {
          dia?: string;
          fecha?: string;
          iniciada_en?: string;
          terminada_en?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
