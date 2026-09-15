# CoxGym

App personal para seguir mi rutina de gimnasio. Al abrirla muestra la sesión que
toca **hoy** según el día de la semana en hora de Lima (America/Lima), con la
animación de cada ejercicio, el registro de series y el progreso.

- **Next.js (App Router) + TypeScript + Tailwind CSS**, diseño hecho en Claude Design
- **Sitio estático** (`output: 'export'`): sin servidor propio
- **Supabase** para guardar series, peso corporal, medidas y fotos (con login)
- **Funciona sin conexión** mientras entrenas: todo se guarda en el teléfono y se
  sube a la nube cuando vuelve la señal
- **PWA instalable**: se puede agregar a la pantalla de inicio del celular

## Qué hace

- **Hoy / Día**: sesión del día, mapa de músculos, lista de ejercicios con su
  miniatura y avance ("2/4 hechas").
- **Ejercicio**: animación de la técnica, series con reps / kg / RPE, sugerencias
  con lo que hiciste la última vez, temporizador de descanso automático (vibra y
  pita al terminar), técnica paso a paso y alternativa. La pantalla no se apaga
  mientras hay una sesión en curso.
- **Resumen**: duración, series, volumen y récords batidos en la sesión.
- **Semana**: los 7 días con lo hecho y lo que está en curso.
- **Progreso**: racha, volumen semanal, 1RM estimado por ejercicio, peso
  corporal, récords, medidas, series por músculo y fotos (antes / después).
  Los gráficos responden al toque: se ve el valor de cada punto o barra.

## Correrlo en local

Requisitos: Node.js 20 o superior.

1. Crear `.env.local` en la raíz con los datos del proyecto de Supabase
   (Supabase → Project Settings → API):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   La clave publicable puede ir en el navegador: los datos los protegen las
   políticas RLS. Sin estas variables la app funciona igual, pero solo guarda en
   el teléfono.

2. Instalar y arrancar:

   ```bash
   npm install
   npm run dev
   ```

Abrir <http://localhost:3000>. Para verlo como en el celular: F12 → ícono de
móvil → un ancho de ~390 px.

Para probar la versión final (la misma que se sube):

```bash
npm run build     # genera la carpeta out/
npx serve out     # sirve out/ en http://localhost:3000
```

## Editar la rutina

Toda la rutina vive en **`src/data/rutina.json`**. Se edita ese archivo y se
vuelve a desplegar; no hay que tocar código.

Estructura de cada día dentro de `semana`:

```jsonc
{
  "dia": "lunes",                 // clave interna, en minúsculas y sin tildes
  "nombreDia": "Lunes",           // lo que se ve en pantalla
  "tipo": "entrenamiento",        // "entrenamiento" o "descanso"
  "titulo": "Pierna A · Glúteo",
  "gruposMusculares": ["Glúteo", "Isquiotibiales"],
  "cardio": "",                   // opcional; si está vacío no se muestra
  "notas": "",                    // aviso destacado arriba del día; opcional
  "ejercicios": [
    {
      "id": "hip-thrust-maquina", // único dentro del día; el mismo id en dos días comparte historial
      "nombre": "Hip thrust en máquina",
      "series": 4,
      "repeticiones": "8-10",     // texto libre: "12", "8-10", "al fallo"
      "descansoSeg": 90,
      "pesoSugerido": "",         // opcional; se usa como sugerencia de kg
      "alternativa": "",          // opcional
      "notas": "",                // opcional
      "musculos": ["gluteo", "isquios"], // el primero es el principal
      "animacion": "1409"         // id del ejercicio en el dataset (ver abajo)
    }
  ]
}
```

Músculos válidos: `pecho`, `hombro`, `hombroPost`, `biceps`, `triceps`,
`espalda`, `trapecio`, `core`, `gluteo`, `isquios`, `cuadriceps`, `gemelo` y
`antebrazo`.

Reglas mínimas:

- Los 7 días deben existir, con las claves `lunes`, `martes`, `miercoles`,
  `jueves`, `viernes`, `sabado` y `domingo`.
- Un día con `"tipo": "descanso"` muestra la tarjeta de descanso y no necesita
  ejercicios.
- Los campos en blanco (`""`) simplemente no se muestran.

Después de editar conviene correr `npm run build`: si el JSON quedó mal
formado, el build falla y avisa.

### Las animaciones de los ejercicios

Salen del dataset [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
(1.300+ ejercicios). Para un ejercicio nuevo:

1. Buscarlo en el [explorador del dataset](https://github.com/hasaneyldrm/exercises-dataset)
   y copiar su id de 4 dígitos en `"animacion"`.
2. Correr el script, que copia a `src/data/ejercicios-dataset.json` solo lo que
   usa la rutina (nombre, equipo, pasos en español y rutas):

   ```bash
   node scripts/importar-ejercicios.mjs
   ```

**Licencia:** los textos del dataset son MIT, pero las animaciones e imágenes
son **© Gym visual** (<https://gymvisual.com/>). No se copian a este repositorio:
la app las enlaza desde el repositorio original (commit fijo) y muestra el
crédito. Sus términos piden una licencia para usarlas en una app; si la app deja
de ser de uso personal, hay que conseguirla o reemplazar las animaciones.

### Los íconos

Los íconos de la PWA están en `public/icons/` y se generan con un script sin
dependencias. Solo hay que volver a correrlo si se cambia el dibujo o el color:

```bash
node scripts/generar-iconos.mjs
```

## Supabase

Proyecto **coxgym** (región São Paulo). Tablas, todas con RLS (cada usuario
solo ve y modifica sus filas):

| Tabla | Qué guarda |
| --- | --- |
| `sesiones` | una fila por día de rutina entrenado (fecha, inicio, fin) |
| `series` | cada serie: ejercicio, número, reps, kg, RPE, hecha |
| `pesos_corporales` | peso por fecha |
| `medidas` | brazo, pecho, cintura… por fecha |
| `fotos_progreso` | la ruta de cada foto; los archivos van al bucket privado `fotos-progreso` |

Las filas usan claves naturales (fecha + día + ejercicio + número de serie), así
que la cola sin conexión puede reenviar cambios sin duplicar nada.

Una sola vez, en el panel de Supabase → **Authentication → URL Configuration**:

- **Site URL**: la URL de la app en Vercel (por ejemplo `https://coxgym.vercel.app`).
- **Redirect URLs**: agregar `https://coxgym.vercel.app/cuenta` y
  `http://localhost:3000/cuenta`.

Así los correos de confirmación y de "olvidé mi contraseña" vuelven a la app.
Si solo la usas tú, después de crear tu cuenta puedes desactivar el registro de
cuentas nuevas en **Authentication → Sign In / Providers**.

En el plan gratuito el proyecto se pausa tras una semana sin uso; se reactiva
desde el panel.

## Desplegar en Vercel

1. Subir el repositorio a GitHub.
2. En <https://vercel.com> → **Add New → Project** → importar el repo.
3. En **Settings → Environment Variables** crear `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (los mismos valores de `.env.local`).
   Van al compilar: si se cambian, hay que volver a desplegar.
4. **Deploy**. Cada `git push` a `main` vuelve a desplegar.

Para instalarla en el celular: abrir la URL en Chrome (Android) o Safari (iOS)
y elegir *Agregar a pantalla de inicio*.

## Alternativa: Firebase Hosting

Sube la carpeta `out/` como sitio estático (con las variables de Supabase en
`.env.local` al compilar).

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

En el asistente:

- **Public directory**: `out`
- **Single-page app**: `No` (cada ruta ya tiene su propio HTML)
- **Sobrescribir index.html**: `No`

Luego, cada vez que haya cambios:

```bash
npm run build
firebase deploy --only hosting
```

## Cómo está organizado

```
src/
  app/
    layout.tsx                          # estructura común, fuente, nav y temporizador
    page.tsx                            # "/"         → la sesión de hoy
    semana/page.tsx                     # "/semana"   → los 7 días
    dia/[dia]/page.tsx                  # "/dia/lunes" → un día
    dia/[dia]/ejercicio/[ejercicio]/    # un ejercicio durante la sesión
    dia/[dia]/resumen/                  # resumen de la sesión
    progreso/page.tsx                   # gráficos y registros
    cuenta/page.tsx                     # login y estado de la nube
    globals.css                         # paleta del diseño y estilos base
  components/
    graficos/                           # barras y líneas interactivas (SVG propio)
    progreso/                           # tarjetas de la pantalla Progreso
    ...                                 # VistaDia, PantallaEjercicio, MapaCuerpo...
  data/
    rutina.json                         # LA RUTINA
    ejercicios-dataset.json             # generado por scripts/importar-ejercicios.mjs
  lib/
    rutina.ts                           # acceso a la rutina
    ejercicios.ts                       # acceso al dataset y crédito de animaciones
    entreno.ts                          # sesiones guardadas en el teléfono
    sincronizacion.ts                   # cola de cambios hacia Supabase
    historial.ts                        # copia local de la nube para los gráficos
    estadisticas.ts                     # volumen, racha, 1RM, récords…
  types/                                # tipos de la rutina y de la base de datos
public/icons/                           # íconos de la PWA
scripts/                                # íconos e importación del dataset
```

Detalles que valen la pena recordar:

- **El día de hoy se calcula en el navegador.** El sitio es estático: si se
  calculara al compilar, quedaría clavado en la fecha del despliegue. Por eso
  `"/"` muestra un esqueleto un instante y luego la sesión correcta.
- **Primero el teléfono, después la nube.** Cada toque se guarda en
  `localStorage` al instante y entra a una cola que se sube en orden cuando hay
  conexión y sesión iniciada. Si hay cambios sin subir, mandan los del teléfono.
- **Los componentes nunca leen los JSON directamente**, siempre pasan por
  `src/lib/rutina.ts` y `src/lib/ejercicios.ts`.
